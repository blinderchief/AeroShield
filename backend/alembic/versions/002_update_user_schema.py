"""Update user schema with new columns

Revision ID: 002_update_user_schema
Revises: 001_initial
Create Date: 2024-12-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_update_user_schema'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('first_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('flare_address', sa.String(42), nullable=True))
    op.add_column('users', sa.Column('xrpl_address', sa.String(35), nullable=True))
    op.add_column('users', sa.Column('is_premium', sa.Boolean(), default=False))
    op.add_column('users', sa.Column('kyc_status', sa.String(20), default='pending'))
    op.add_column('users', sa.Column('kyc_completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('risk_score', sa.Float(), default=50.0))
    op.add_column('users', sa.Column('total_policies', sa.Integer(), default=0))
    op.add_column('users', sa.Column('total_claims', sa.Integer(), default=0))
    op.add_column('users', sa.Column('total_payouts_received', sa.Numeric(precision=36, scale=18), default=0))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    
    # Create indexes for new columns
    op.create_index('ix_users_flare_address', 'users', ['flare_address'])
    op.create_index('ix_users_xrpl_address', 'users', ['xrpl_address'])
    
    # Migrate data from old columns if they exist
    # Copy wallet_address to flare_address
    op.execute("UPDATE users SET flare_address = wallet_address WHERE wallet_address IS NOT NULL")
    # Copy full_name to first_name (as a fallback)
    op.execute("UPDATE users SET first_name = full_name WHERE full_name IS NOT NULL")
    
    # Drop old columns
    op.drop_index('ix_users_wallet_address', table_name='users')
    op.drop_column('users', 'wallet_address')
    op.drop_column('users', 'full_name')


def downgrade() -> None:
    # Add back old columns
    op.add_column('users', sa.Column('wallet_address', sa.String(42), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))
    op.create_index('ix_users_wallet_address', 'users', ['wallet_address'])
    
    # Migrate data back
    op.execute("UPDATE users SET wallet_address = flare_address WHERE flare_address IS NOT NULL")
    op.execute("UPDATE users SET full_name = first_name WHERE first_name IS NOT NULL")
    
    # Drop new indexes
    op.drop_index('ix_users_flare_address', table_name='users')
    op.drop_index('ix_users_xrpl_address', table_name='users')
    
    # Drop new columns
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'flare_address')
    op.drop_column('users', 'xrpl_address')
    op.drop_column('users', 'is_premium')
    op.drop_column('users', 'kyc_status')
    op.drop_column('users', 'kyc_completed_at')
    op.drop_column('users', 'risk_score')
    op.drop_column('users', 'total_policies')
    op.drop_column('users', 'total_claims')
    op.drop_column('users', 'total_payouts_received')
    op.drop_column('users', 'last_login_at')
