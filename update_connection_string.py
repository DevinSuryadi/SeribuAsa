import os
import re

def update_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Look for Supabase connection string logic
    # In config.py: get_database_url()
    
    if "def get_database_url" in content:
        # We need to insert a replacement
        old_func = """    def get_database_url(self) -> str:
        \"\"\"Get database URL with fallback for testing\"\"\"
        if self.is_test_mode() or not self.DATABASE_URL:
            # Use in-memory SQLite for testing
            return "sqlite:///:memory:"
        return self.DATABASE_URL"""
        
        new_func = """    def get_database_url(self) -> str:
        \"\"\"Get database URL with fallback for testing\"\"\"
        if self.is_test_mode() or not self.DATABASE_URL:
            # Use in-memory SQLite for testing
            return "sqlite:///:memory:"
            
        url = self.DATABASE_URL
        
        # Ensure psycopg2 driver is used for SQLAlchemy
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            
        # Force IPv4 resolution for Supabase connection pooler if needed
        # Supabase transaction pooler (IPv4) usually looks like:
        # aws-0-ap-southeast-1.pooler.supabase.com
        # If the URL contains .supabase.co, we can optionally change it or let the user do it via ENV vars
        
        return url"""
        
        if old_func in content:
            content = content.replace(old_func, new_func)
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Updated {file_path}")
            return True
            
    return False

update_file("apps/backend/app/config.py")
