"""Add asset versioning columns

Revision ID: 2026_01_01_2300
Revises: 
Create Date: 2026-01-01 23:00:00

Adds self-referential parent_id and versioning fields to assets table.
Per best practices: nullable parent_id allows root nodes (originals).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_asset_versioning'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add versioning columns to assets table
    # Per Perplexity research: nullable FK for self-ref allows root nodes
    op.add_column('assets', sa.Column('parent_id', sa.String(36), nullable=True))
    op.add_column('assets', sa.Column('version_number', sa.Integer(), server_default='1', nullable=False))
    op.add_column('assets', sa.Column('is_original', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('assets', sa.Column('processing_status', sa.String(20), server_default='completed', nullable=False))
    
    # Create self-referential foreign key with explicit name
    op.create_foreign_key(
        'fk_assets_parent_id',
        'assets',
        'assets',
        ['parent_id'],
        ['id'],
        ondelete='SET NULL'
    )
    
    # Add index for efficient version queries
    op.create_index('ix_assets_parent_id', 'assets', ['parent_id'])


def downgrade() -> None:
    # Remove in reverse order
    op.drop_index('ix_assets_parent_id', table_name='assets')
    op.drop_constraint('fk_assets_parent_id', 'assets', type_='foreignkey')
    op.drop_column('assets', 'processing_status')
    op.drop_column('assets', 'is_original')
    op.drop_column('assets', 'version_number')
    op.drop_column('assets', 'parent_id')
