from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from app.core.database import Base

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ident = Column(String(64), unique=True, index=True, nullable=False)
    
    # Verbatim original logbook entries
    problem_raw = Column(Text, nullable=False)
    action_raw = Column(Text, nullable=False)
    combined_raw = Column(Text, nullable=False)

    # Cleaned & normalized text representations
    problem_clean = Column(Text, nullable=False)
    action_clean = Column(Text, nullable=False)
    combined_clean = Column(Text, nullable=False)

    # Extracted technical categories for filtering and analytics
    component_tag = Column(String(128), index=True, nullable=True)
    action_type = Column(String(128), index=True, nullable=True)
    performed_edit = Column(String(128), nullable=True)

    # Ingestion metadata
    source_filename = Column(String(256), nullable=False, default="Aircraft_Annotation_DataFile.csv")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_record_component_action", "component_tag", "action_type"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "ident": self.ident,
            "problem": self.problem_raw,
            "action": self.action_raw,
            "problem_clean": self.problem_clean,
            "action_clean": self.action_clean,
            "combined_clean": self.combined_clean,
            "component_tag": self.component_tag,
            "action_type": self.action_type,
            "performed_edit": self.performed_edit,
            "source_filename": self.source_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
