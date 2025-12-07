"""Check database columns and fix schema if needed"""
import asyncio
from sqlalchemy import text
from core.database import engine

async def check_and_fix():
    async with engine.connect() as conn:
        # Check current columns in users table
        result = await conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
        ))
        columns = [row[0] for row in result.fetchall()]
        print(f"Current columns in users table: {columns}")
        
        # Check which required columns are missing
        required_columns = [
            'first_name', 'last_name', 'avatar_url', 'phone', 
            'flare_address', 'xrpl_address', 'is_premium', 'kyc_status',
            'kyc_completed_at', 'risk_score', 'total_policies', 
            'total_claims', 'total_payouts_received', 'last_login_at'
        ]
        
        missing = [col for col in required_columns if col not in columns]
        print(f"Missing columns: {missing}")
        
        if missing:
            print("\nAdding missing columns...")
            
            column_defs = {
                'first_name': "VARCHAR(100)",
                'last_name': "VARCHAR(100)",
                'avatar_url': "TEXT",
                'phone': "VARCHAR(20)",
                'flare_address': "VARCHAR(42)",
                'xrpl_address': "VARCHAR(35)",
                'is_premium': "BOOLEAN DEFAULT FALSE",
                'kyc_status': "VARCHAR(20) DEFAULT 'pending'",
                'kyc_completed_at': "TIMESTAMP WITH TIME ZONE",
                'risk_score': "FLOAT DEFAULT 50.0",
                'total_policies': "INTEGER DEFAULT 0",
                'total_claims': "INTEGER DEFAULT 0",
                'total_payouts_received': "NUMERIC(36, 18) DEFAULT 0",
                'last_login_at': "TIMESTAMP WITH TIME ZONE"
            }
            
            for col in missing:
                if col in column_defs:
                    sql = f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {column_defs[col]}"
                    print(f"  Running: {sql}")
                    await conn.execute(text(sql))
            
            await conn.commit()
            print("\nColumns added successfully!")
        else:
            print("\nAll required columns exist.")

if __name__ == "__main__":
    asyncio.run(check_and_fix())
