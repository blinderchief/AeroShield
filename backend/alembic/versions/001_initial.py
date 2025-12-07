"""Initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('clerk_id', sa.String(255), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('wallet_address', sa.String(42), nullable=True),
        sa.Column('smart_account_address', sa.String(42), nullable=True),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_clerk_id', 'users', ['clerk_id'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_wallet_address', 'users', ['wallet_address'])

    # Create policies table
    op.create_table(
        'policies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('policy_id_onchain', sa.String(66), unique=True, nullable=True),
        sa.Column('flight_number', sa.String(20), nullable=False),
        sa.Column('departure_airport', sa.String(10), nullable=False),
        sa.Column('arrival_airport', sa.String(10), nullable=False),
        sa.Column('departure_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('arrival_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('coverage_amount', sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column('premium_paid', sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column('delay_1h_payout', sa.Integer(), default=2500),
        sa.Column('delay_2h_payout', sa.Integer(), default=5000),
        sa.Column('delay_4h_payout', sa.Integer(), default=7500),
        sa.Column('cancellation_payout', sa.Integer(), default=10000),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('ai_analysis', postgresql.JSONB(), nullable=True),
        sa.Column('token_id', sa.BigInteger(), nullable=True),
        sa.Column('tx_hash', sa.String(66), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_policies_user_id', 'policies', ['user_id'])
    op.create_index('ix_policies_flight_number', 'policies', ['flight_number'])
    op.create_index('ix_policies_status', 'policies', ['status'])

    # Create claims table
    op.create_table(
        'claims',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('policy_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('policies.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('claim_id_onchain', sa.String(66), nullable=True),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('claim_type', sa.String(20), nullable=False),
        sa.Column('delay_minutes', sa.Integer(), nullable=True),
        sa.Column('is_cancelled', sa.Boolean(), default=False),
        sa.Column('payout_amount', sa.Numeric(precision=18, scale=6), nullable=True),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('attestation_id', sa.String(66), nullable=True),
        sa.Column('attestation_data', postgresql.JSONB(), nullable=True),
        sa.Column('tx_hash', sa.String(66), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_claims_policy_id', 'claims', ['policy_id'])
    op.create_index('ix_claims_user_id', 'claims', ['user_id'])
    op.create_index('ix_claims_status', 'claims', ['status'])

    # Create pools table
    op.create_table(
        'pools',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('contract_address', sa.String(42), unique=True, nullable=True),
        sa.Column('total_liquidity', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('reserved_liquidity', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('total_shares', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('total_premiums', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('total_payouts', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('min_deposit', sa.Numeric(precision=18, scale=6), default=10),
        sa.Column('max_utilization', sa.Integer(), default=8000),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create liquidity_positions table
    op.create_table(
        'liquidity_positions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('pool_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pools.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('share_balance', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('earned_yield', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('claimed_yield', sa.Numeric(precision=36, scale=18), default=0),
        sa.Column('last_deposit_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_liquidity_positions_user_id', 'liquidity_positions', ['user_id'])
    op.create_index('ix_liquidity_positions_pool_id', 'liquidity_positions', ['pool_id'])

    # Create ai_predictions table
    op.create_table(
        'ai_predictions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('flight_number', sa.String(20), nullable=False),
        sa.Column('flight_date', sa.Date(), nullable=False),
        sa.Column('prediction_type', sa.String(50), nullable=False),
        sa.Column('delay_probability', sa.Float(), nullable=True),
        sa.Column('predicted_delay_minutes', sa.Integer(), nullable=True),
        sa.Column('cancellation_probability', sa.Float(), nullable=True),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('risk_factors', postgresql.JSONB(), nullable=True),
        sa.Column('recommended_premium_rate', sa.Float(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(50), nullable=True),
        sa.Column('raw_response', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_ai_predictions_flight', 'ai_predictions', ['flight_number', 'flight_date'])

    # Create fdc_events table
    op.create_table(
        'fdc_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', sa.String(66), unique=True, nullable=False),
        sa.Column('attestation_type', sa.String(50), nullable=False),
        sa.Column('source_id', sa.String(66), nullable=False),
        sa.Column('flight_number', sa.String(20), nullable=True),
        sa.Column('flight_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('request_body', postgresql.JSONB(), nullable=True),
        sa.Column('response_body', postgresql.JSONB(), nullable=True),
        sa.Column('voting_round', sa.BigInteger(), nullable=True),
        sa.Column('tx_hash', sa.String(66), nullable=True),
        sa.Column('finalized_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_fdc_events_request_id', 'fdc_events', ['request_id'])
    op.create_index('ix_fdc_events_status', 'fdc_events', ['status'])


def downgrade() -> None:
    op.drop_table('fdc_events')
    op.drop_table('ai_predictions')
    op.drop_table('liquidity_positions')
    op.drop_table('pools')
    op.drop_table('claims')
    op.drop_table('policies')
    op.drop_table('users')
