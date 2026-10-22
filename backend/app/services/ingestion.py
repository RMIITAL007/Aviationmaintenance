import csv
import io
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.record import MaintenanceRecord
from app.services.normalizer import normalizer
from app.core.config import settings

logger = logging.getLogger(__name__)

class IngestionService:
    def __init__(self):
        pass

    async def ingest_csv_content(
        self,
        content: bytes,
        filename: str,
        db: AsyncSession,
        batch_size: int = 500
    ) -> Dict[str, Any]:
        """
        Parses and ingests CSV logbook content idempotently.
        Handles missing fields, malformed rows, encodings, and duplicates.
        """
        text = ""
        for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
            try:
                text = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        if not text:
            raise ValueError("Unable to decode uploaded CSV file with supported encodings.")

        # Detect dialect / delimiter
        csv_file = io.StringIO(text)
        reader = csv.reader(csv_file)
        
        try:
            header = next(reader)
        except StopIteration:
            return {
                "status": "empty",
                "filename": filename,
                "total_rows_read": 0,
                "records_imported": 0,
                "duplicates_skipped": 0,
                "errors_encountered": 0
            }

        # Normalize header column names
        header_map = {}
        for idx, col in enumerate(header):
            clean_col = col.strip().upper().replace('"', '').replace("'", "")
            header_map[clean_col] = idx

        # Locate required columns: IDENT/ID, PROBLEM, ACTION
        ident_idx = header_map.get("IDENT") if "IDENT" in header_map else header_map.get("ID")
        problem_idx = header_map.get("PROBLEM")
        action_idx = header_map.get("ACTION")

        if ident_idx is None or problem_idx is None or action_idx is None:
            raise ValueError(f"CSV header missing required columns. Expected IDENT/ID, PROBLEM, ACTION. Found: {header}")

        # Fetch all existing idents from DB to ensure idempotency
        existing_idents_query = await db.execute(select(MaintenanceRecord.ident))
        existing_idents = set(existing_idents_query.scalars().all())

        total_rows_read = 0
        records_imported = 0
        duplicates_skipped = 0
        errors_encountered = 0
        batch: List[MaintenanceRecord] = []
        seen_in_file: set = set()

        for row_num, row in enumerate(reader, start=2):
            total_rows_read += 1
            if len(row) <= max(ident_idx, problem_idx, action_idx):
                errors_encountered += 1
                continue

            ident_val = str(row[ident_idx]).strip()
            # Clean floating point numbers like '100001.0'
            if ident_val.endswith(".0"):
                ident_val = ident_val[:-2]

            problem_val = str(row[problem_idx]).strip()
            action_val = str(row[action_idx]).strip()

            if not ident_val or not problem_val:
                errors_encountered += 1
                continue

            if ident_val in existing_idents or ident_val in seen_in_file:
                duplicates_skipped += 1
                continue

            seen_in_file.add(ident_val)

            # Normalization
            prob_clean, act_clean, combined_clean = normalizer.clean_record_text(problem_val, action_val)
            combined_raw = f"{problem_val} {action_val}".strip()
            component_tag = normalizer.extract_component_tag(combined_clean)
            action_type = normalizer.extract_action_type(act_clean)

            record = MaintenanceRecord(
                ident=ident_val,
                problem_raw=problem_val,
                action_raw=action_val,
                combined_raw=combined_raw,
                problem_clean=prob_clean,
                action_clean=act_clean,
                combined_clean=combined_clean,
                component_tag=component_tag,
                action_type=action_type,
                performed_edit=None,
                source_filename=filename
            )
            batch.append(record)

            if len(batch) >= batch_size:
                db.add_all(batch)
                await db.flush()
                records_imported += len(batch)
                batch = []

        if batch:
            db.add_all(batch)
            await db.flush()
            records_imported += len(batch)

        await db.commit()

        return {
            "status": "success",
            "filename": filename,
            "total_rows_read": total_rows_read,
            "records_imported": records_imported,
            "duplicates_skipped": duplicates_skipped,
            "errors_encountered": errors_encountered
        }

    async def ingest_excel_file(
        self,
        filepath: Path,
        db: AsyncSession,
        batch_size: int = 500
    ) -> Dict[str, Any]:
        """
        Parses the official cleaned MaintNet Excel workbook containing
        'MaintNet Aviation Maint Dataset' with ID, ORIGINAL INSTANCE, COMBINED & CLEANED INSTANCE, PERFORMED EDIT.
        """
        df = pd.read_excel(filepath, sheet_name="MaintNet Aviation Maint Dataset", header=None)
        
        existing_idents_query = await db.execute(select(MaintenanceRecord.ident))
        existing_idents = set(existing_idents_query.scalars().all())

        total_rows_read = 0
        records_imported = 0
        duplicates_skipped = 0
        errors_encountered = 0
        batch: List[MaintenanceRecord] = []
        seen_in_file: set = set()

        # Rows 0 and 1 are headers:
        # Row 0: ['ID', 'ORIGINAL INSTANCE', nan, 'COMBINED & CLEANED INSTANCE', 'PERFORMED EDIT']
        # Row 1: [nan, 'PROBLEM', 'ACTION', nan, nan]
        for row_idx in range(2, len(df)):
            total_rows_read += 1
            row = df.iloc[row_idx]
            
            raw_id = row[0]
            if pd.isna(raw_id):
                errors_encountered += 1
                continue
            
            ident_val = str(int(raw_id) if isinstance(raw_id, (int, float)) and not pd.isna(raw_id) else raw_id).strip()
            if ident_val.endswith(".0"):
                ident_val = ident_val[:-2]

            problem_val = str(row[1]).strip() if not pd.isna(row[1]) else ""
            action_val = str(row[2]).strip() if not pd.isna(row[2]) else ""
            combined_clean_val = str(row[3]).strip() if not pd.isna(row[3]) else ""
            performed_edit_val = str(row[4]).strip() if not pd.isna(row[4]) else None

            if not ident_val or not problem_val:
                errors_encountered += 1
                continue

            if ident_val in existing_idents or ident_val in seen_in_file:
                duplicates_skipped += 1
                continue

            seen_in_file.add(ident_val)

            # Normalization fallback if combined clean is blank
            prob_clean, act_clean, derived_clean = normalizer.clean_record_text(problem_val, action_val)
            final_clean = combined_clean_val if combined_clean_val else derived_clean
            combined_raw = f"{problem_val} {action_val}".strip()
            component_tag = normalizer.extract_component_tag(final_clean)
            action_type = normalizer.extract_action_type(act_clean)

            record = MaintenanceRecord(
                ident=ident_val,
                problem_raw=problem_val,
                action_raw=action_val,
                combined_raw=combined_raw,
                problem_clean=prob_clean,
                action_clean=act_clean,
                combined_clean=final_clean,
                component_tag=component_tag,
                action_type=action_type,
                performed_edit=performed_edit_val,
                source_filename=filepath.name
            )
            batch.append(record)

            if len(batch) >= batch_size:
                db.add_all(batch)
                await db.flush()
                records_imported += len(batch)
                batch = []

        if batch:
            db.add_all(batch)
            await db.flush()
            records_imported += len(batch)

        await db.commit()

        return {
            "status": "success",
            "filename": filepath.name,
            "total_rows_read": total_rows_read,
            "records_imported": records_imported,
            "duplicates_skipped": duplicates_skipped,
            "errors_encountered": errors_encountered
        }

    async def get_ingestion_status(self, db: AsyncSession) -> Dict[str, Any]:
        count_res = await db.execute(select(func.count(MaintenanceRecord.id)))
        total_records = count_res.scalar() or 0

        files_res = await db.execute(select(MaintenanceRecord.source_filename).distinct())
        source_files = files_res.scalars().all()

        latest_res = await db.execute(select(func.max(MaintenanceRecord.created_at)))
        latest_date = latest_res.scalar()

        return {
            "is_ingested": total_records > 0,
            "total_records": total_records,
            "source_files": list(source_files),
            "last_ingested_at": latest_date.isoformat() if latest_date else None,
            "vector_indexed": False,  # Updated by embedding service
            "vector_count": 0
        }

ingestion_service = IngestionService()
