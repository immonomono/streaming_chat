"""add uuid to conversations

Revision ID: a28836d0b4d8
Revises: eebd9fea7010
Create Date: 2026-03-11 10:52:41.973507

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a28836d0b4d8'
down_revision: Union[str, None] = 'eebd9fea7010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # Check if uuid column already exists (from partial previous run)
    result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.columns "
        "WHERE table_name = 'conversations' AND column_name = 'uuid'"
    ))
    column_exists = result.scalar() > 0

    if not column_exists:
        op.add_column('conversations', sa.Column('uuid', sa.String(length=36), nullable=True))

    # Fill existing rows with UUIDs where missing
    rows = conn.execute(sa.text("SELECT id FROM conversations WHERE uuid IS NULL")).fetchall()
    for row in rows:
        conn.execute(
            sa.text("UPDATE conversations SET uuid = :uuid WHERE id = :id"),
            {"uuid": str(uuid.uuid4()), "id": row[0]},
        )

    # Make non-nullable
    op.alter_column('conversations', 'uuid', existing_type=sa.String(36), nullable=False)

    # Check if index exists
    idx_result = conn.execute(sa.text(
        "SELECT COUNT(*) FROM information_schema.statistics "
        "WHERE table_name = 'conversations' AND index_name = 'ix_conversations_uuid'"
    ))
    if idx_result.scalar() == 0:
        op.create_index(op.f('ix_conversations_uuid'), 'conversations', ['uuid'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_conversations_uuid'), table_name='conversations')
    op.drop_column('conversations', 'uuid')
