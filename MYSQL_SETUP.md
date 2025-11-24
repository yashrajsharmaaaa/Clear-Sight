# MySQL Setup Guide for ClearSight

This guide provides comprehensive instructions for setting up MySQL database for the ClearSight face recognition application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local MySQL Installation](#local-mysql-installation)
3. [Database and User Creation](#database-and-user-creation)
4. [Environment Configuration](#environment-configuration)
5. [Verification Steps](#verification-steps)
6. [Cloud Platform Setup](#cloud-platform-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up MySQL, ensure you have:

- Python 3.8 or higher installed
- Administrative access to install MySQL (for local setup)
- Basic familiarity with command-line operations

---

## Local MySQL Installation

### Windows

1. **Download MySQL Installer:**
   - Visit [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
   - Download the MySQL Installer for Windows

2. **Run the Installer:**
   - Choose "Developer Default" or "Server only" setup type
   - Follow the installation wizard
   - Set a root password (remember this!)

3. **Configure MySQL Server:**
   - Default port: 3306
   - Start MySQL as a Windows Service (recommended)

4. **Verify Installation:**
   ```cmd
   mysql --version
   ```

### macOS

1. **Using Homebrew (Recommended):**
   ```bash
   # Install Homebrew if not already installed
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install MySQL
   brew install mysql
   
   # Start MySQL service
   brew services start mysql
   ```

2. **Secure the Installation:**
   ```bash
   mysql_secure_installation
   ```
   - Set root password
   - Remove anonymous users
   - Disallow root login remotely
   - Remove test database

3. **Verify Installation:**
   ```bash
   mysql --version
   ```

### Linux (Ubuntu/Debian)

1. **Update Package Index:**
   ```bash
   sudo apt update
   ```

2. **Install MySQL Server:**
   ```bash
   sudo apt install mysql-server
   ```

3. **Start MySQL Service:**
   ```bash
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

4. **Secure the Installation:**
   ```bash
   sudo mysql_secure_installation
   ```

5. **Verify Installation:**
   ```bash
   mysql --version
   ```

### Linux (CentOS/RHEL/Fedora)

1. **Install MySQL Repository:**
   ```bash
   sudo dnf install mysql-server
   ```

2. **Start MySQL Service:**
   ```bash
   sudo systemctl start mysqld
   sudo systemctl enable mysqld
   ```

3. **Get Temporary Root Password:**
   ```bash
   sudo grep 'temporary password' /var/log/mysqld.log
   ```

4. **Secure the Installation:**
   ```bash
   sudo mysql_secure_installation
   ```

---

## Database and User Creation

After installing MySQL, create a dedicated database and user for ClearSight:

### Step 1: Connect to MySQL

```bash
# Connect as root user
mysql -u root -p
```

Enter your root password when prompted.

### Step 2: Create Database

```sql
-- Create the ClearSight database
CREATE DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Create User

```sql
-- Create a dedicated user for ClearSight
CREATE USER 'clearsight_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- For remote access (if needed), use:
-- CREATE USER 'clearsight_user'@'%' IDENTIFIED BY 'your_secure_password_here';
```

**Security Note:** Replace `'your_secure_password_here'` with a strong password. Use a password generator for production environments.

### Step 4: Grant Permissions

```sql
-- Grant all privileges on the clearsight database to the user
GRANT ALL PRIVILEGES ON clearsight.* TO 'clearsight_user'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
```

### Step 5: Verify User Creation

```sql
-- Show all users
SELECT User, Host FROM mysql.user WHERE User = 'clearsight_user';

-- Exit MySQL
EXIT;
```

### Step 6: Test User Connection

```bash
# Test connection with the new user
mysql -u clearsight_user -p clearsight
```

If you can connect successfully, the database and user are set up correctly!

---

## Environment Configuration

### Required Environment Variables

ClearSight requires the following environment variables to connect to MySQL:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MYSQL_HOST` | MySQL server hostname | `localhost` | Yes |
| `MYSQL_PORT` | MySQL server port | `3306` | No (defaults to 3306) |
| `MYSQL_DATABASE` | Database name | `clearsight` | Yes |
| `MYSQL_USER` | Database username | `clearsight_user` | Yes |
| `MYSQL_PASSWORD` | Database password | `your_secure_password` | Yes |
| `MYSQL_POOL_SIZE` | Connection pool size | `5` | No (defaults to 5) |
| `MYSQL_POOL_RECYCLE` | Connection recycle time (seconds) | `3600` | No (defaults to 3600) |

### Configuration Steps

1. **Navigate to Backend Directory:**
   ```bash
   cd backend
   ```

2. **Copy Environment Template:**
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

3. **Edit .env File:**
   
   Open `.env` in your text editor and update the MySQL configuration:

   ```bash
   # MySQL Database Configuration
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=clearsight_user
   MYSQL_PASSWORD=your_secure_password_here
   
   # MySQL Connection Pool Settings (optional)
   MYSQL_POOL_SIZE=5
   MYSQL_POOL_RECYCLE=3600
   
   # Other required variables
   SECRET_KEY=your-secret-key-here
   CORS_ORIGINS=http://localhost:3000
   ```

4. **Generate Secret Key (if needed):**
   ```python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

---

## Verification Steps

After configuration, verify that everything is working correctly:

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Initialize Database Schema

```bash
python database.py
```

Expected output:
```
Database initialized successfully!
```

### Step 3: Test Database Connection

Create a test script `test_connection.py`:

```python
from database import get_db_connection

try:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✓ Successfully connected to MySQL!")
        print(f"✓ MySQL version: {version[0]}")
        
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"✓ Tables found: {[table[0] for table in tables]}")
        
except Exception as e:
    print(f"✗ Connection failed: {e}")
```

Run the test:
```bash
python test_connection.py
```

### Step 4: Run Application Tests

```bash
# Run all tests
pytest

# Run specific database tests
pytest test_db_connection.py
pytest test_schema_init.py
pytest test_crud_operations.py
```

### Step 5: Start the Application

```bash
python app.py
```

The application should start without errors and connect to MySQL successfully.

---

## Cloud Platform Setup

### AWS RDS (Amazon Relational Database Service)

1. **Create RDS MySQL Instance:**
   - Go to AWS RDS Console
   - Click "Create database"
   - Choose "MySQL" engine
   - Select version (8.0 or higher recommended)
   - Choose instance size (db.t3.micro for testing)
   - Set master username and password
   - Configure VPC and security groups
   - Enable public accessibility (if needed)

2. **Configure Security Group:**
   - Add inbound rule for MySQL (port 3306)
   - Source: Your application's IP or security group

3. **Get Connection Details:**
   - Endpoint: `your-instance.region.rds.amazonaws.com`
   - Port: `3306`
   - Database: Create using MySQL client

4. **Environment Variables:**
   ```bash
   MYSQL_HOST=your-instance.region.rds.amazonaws.com
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=admin
   MYSQL_PASSWORD=your_master_password
   ```

5. **Create Database:**
   ```bash
   mysql -h your-instance.region.rds.amazonaws.com -u admin -p
   CREATE DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Google Cloud SQL

1. **Create Cloud SQL Instance:**
   - Go to Cloud SQL Console
   - Click "Create Instance"
   - Choose "MySQL"
   - Configure instance ID, password, region
   - Choose machine type and storage

2. **Configure Connections:**
   - Add authorized networks (for public IP)
   - Or use Cloud SQL Proxy for secure connection

3. **Get Connection Details:**
   - Public IP address from instance details
   - Or use Cloud SQL Proxy connection name

4. **Environment Variables:**
   ```bash
   MYSQL_HOST=your-instance-ip
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   ```

5. **Using Cloud SQL Proxy (Recommended):**
   ```bash
   # Download Cloud SQL Proxy
   wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
   chmod +x cloud_sql_proxy
   
   # Start proxy
   ./cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:3306
   
   # Use localhost in environment variables
   MYSQL_HOST=localhost
   ```

### Railway

1. **Create MySQL Database:**
   - Go to Railway dashboard
   - Click "New Project"
   - Add "MySQL" from database options
   - Railway automatically provisions the database

2. **Get Connection Details:**
   - Click on MySQL service
   - Copy connection details from "Connect" tab

3. **Environment Variables:**
   Railway provides these automatically, but you can also set them manually:
   ```bash
   MYSQL_HOST=containers-us-west-xxx.railway.app
   MYSQL_PORT=6543
   MYSQL_DATABASE=railway
   MYSQL_USER=root
   MYSQL_PASSWORD=generated_password
   ```

4. **Deploy Application:**
   - Add your application to the same project
   - Railway automatically links the database
   - Environment variables are injected automatically

### Render

1. **Create MySQL Database:**
   - Note: Render doesn't offer MySQL directly
   - Options:
     - Use external MySQL provider (PlanetScale, AWS RDS)
     - Use Render PostgreSQL instead
     - Use Railway MySQL and connect from Render

2. **Using External MySQL:**
   - Set up MySQL on another platform
   - Add environment variables in Render dashboard

3. **Environment Variables in Render:**
   - Go to your web service
   - Navigate to "Environment" tab
   - Add MySQL connection variables:
   ```
   MYSQL_HOST=your-external-host
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight
   MYSQL_USER=your_user
   MYSQL_PASSWORD=your_password
   ```

### PlanetScale (Serverless MySQL)

1. **Create Database:**
   - Sign up at [PlanetScale](https://planetscale.com/)
   - Create new database
   - Choose region closest to your application

2. **Create Branch:**
   - PlanetScale uses branches (like Git)
   - Main branch is created automatically
   - Create development branch for testing

3. **Get Connection String:**
   - Click "Connect"
   - Choose "General" connection type
   - Copy connection details

4. **Environment Variables:**
   ```bash
   MYSQL_HOST=aws.connect.psdb.cloud
   MYSQL_PORT=3306
   MYSQL_DATABASE=your-database
   MYSQL_USER=generated_username
   MYSQL_PASSWORD=generated_password
   ```

5. **SSL Configuration:**
   PlanetScale requires SSL. Update `database.py` if needed:
   ```python
   self.config = {
       # ... other config
       'ssl_disabled': False,
   }
   ```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused

**Error:**
```
mysql.connector.errors.DatabaseError: 2003: Can't connect to MySQL server on 'localhost:3306'
```

**Solutions:**
- Verify MySQL service is running:
  ```bash
  # Windows
  net start MySQL80
  
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status mysql
  ```
- Check if MySQL is listening on port 3306:
  ```bash
  netstat -an | grep 3306
  ```
- Verify firewall settings allow port 3306

#### 2. Access Denied

**Error:**
```
mysql.connector.errors.ProgrammingError: 1045: Access denied for user 'clearsight_user'@'localhost'
```

**Solutions:**
- Verify username and password in `.env` file
- Check user exists and has correct permissions:
  ```sql
  SELECT User, Host FROM mysql.user WHERE User = 'clearsight_user';
  SHOW GRANTS FOR 'clearsight_user'@'localhost';
  ```
- Reset user password if needed:
  ```sql
  ALTER USER 'clearsight_user'@'localhost' IDENTIFIED BY 'new_password';
  FLUSH PRIVILEGES;
  ```

#### 3. Database Does Not Exist

**Error:**
```
mysql.connector.errors.ProgrammingError: 1049: Unknown database 'clearsight'
```

**Solutions:**
- Create the database:
  ```sql
  CREATE DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- Verify database name in `.env` matches created database

#### 4. Missing Environment Variables

**Error:**
```
ValueError: Missing required MySQL environment variables: MYSQL_HOST, MYSQL_PASSWORD
```

**Solutions:**
- Ensure `.env` file exists in backend directory
- Verify all required variables are set:
  ```bash
  # Check if .env file exists
  ls -la .env
  
  # View environment variables (be careful with passwords!)
  cat .env
  ```
- Copy from template if needed:
  ```bash
  cp .env.example .env
  ```

#### 5. Connection Pool Exhausted

**Error:**
```
MySQLError: Timeout waiting for connection from pool
```

**Solutions:**
- Increase pool size in `.env`:
  ```bash
  MYSQL_POOL_SIZE=10
  ```
- Check for connection leaks in code
- Ensure connections are properly closed
- Monitor active connections:
  ```sql
  SHOW PROCESSLIST;
  ```

#### 6. Foreign Key Constraint Fails

**Error:**
```
mysql.connector.errors.IntegrityError: 1452: Cannot add or update a child row
```

**Solutions:**
- Ensure parent record exists before creating child record
- Check foreign key relationships in schema
- Verify InnoDB engine is being used:
  ```sql
  SHOW TABLE STATUS WHERE Name = 'recognition_logs';
  ```

#### 7. Character Encoding Issues

**Error:**
```
UnicodeEncodeError: 'latin-1' codec can't encode character
```

**Solutions:**
- Verify database uses UTF-8:
  ```sql
  SHOW CREATE DATABASE clearsight;
  ```
- Ensure tables use UTF-8:
  ```sql
  ALTER DATABASE clearsight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

#### 8. Port Already in Use

**Error:**
```
Can't start MySQL server: Port 3306 is already in use
```

**Solutions:**
- Check what's using port 3306:
  ```bash
  # Windows
  netstat -ano | findstr :3306
  
  # macOS/Linux
  lsof -i :3306
  ```
- Stop conflicting service or change MySQL port
- Update `MYSQL_PORT` in `.env` if using non-standard port

#### 9. SSL/TLS Connection Issues

**Error:**
```
SSL connection error: SSL is required
```

**Solutions:**
- For cloud databases, ensure SSL is enabled
- Add SSL configuration to connection:
  ```python
  self.config = {
      # ... other config
      'ssl_disabled': False,
  }
  ```
- Download SSL certificates if required by provider

#### 10. Slow Query Performance

**Symptoms:**
- Application responds slowly
- Database queries take too long

**Solutions:**
- Check if indexes exist:
  ```sql
  SHOW INDEX FROM users;
  SHOW INDEX FROM recognition_logs;
  ```
- Analyze slow queries:
  ```sql
  SHOW FULL PROCESSLIST;
  ```
- Enable slow query log:
  ```sql
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 2;
  ```
- Optimize queries and add indexes as needed

### Getting Help

If you encounter issues not covered here:

1. **Check Application Logs:**
   - Look for detailed error messages in console output
   - Check MySQL error log location:
     ```sql
     SHOW VARIABLES LIKE 'log_error';
     ```

2. **Test Connection Manually:**
   ```bash
   mysql -h MYSQL_HOST -P MYSQL_PORT -u MYSQL_USER -p MYSQL_DATABASE
   ```

3. **Verify MySQL Status:**
   ```sql
   SHOW STATUS;
   SHOW VARIABLES;
   ```

4. **Community Resources:**
   - MySQL Documentation: https://dev.mysql.com/doc/
   - Stack Overflow: Tag questions with `mysql` and `python`
   - GitHub Issues: Report bugs in the ClearSight repository

---

## Security Best Practices

1. **Use Strong Passwords:**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Use password manager or generator

2. **Limit User Permissions:**
   - Grant only necessary privileges
   - Use separate users for different environments
   - Never use root user for applications

3. **Enable SSL/TLS:**
   - Use encrypted connections for production
   - Especially important for cloud databases

4. **Regular Backups:**
   - Set up automated backups
   - Test restore procedures
   - Store backups securely

5. **Keep MySQL Updated:**
   - Apply security patches promptly
   - Monitor MySQL security advisories

6. **Network Security:**
   - Use firewalls to restrict access
   - Whitelist only necessary IP addresses
   - Use VPN or private networks when possible

7. **Monitor Access:**
   - Review MySQL logs regularly
   - Set up alerts for suspicious activity
   - Audit user permissions periodically

---

## Next Steps

After completing MySQL setup:

1. ✓ MySQL installed and running
2. ✓ Database and user created
3. ✓ Environment variables configured
4. ✓ Connection verified
5. → Run database migrations (if any)
6. → Start the ClearSight application
7. → Test face registration and recognition features

For deployment instructions, see [RENDER_CONFIG.md](RENDER_CONFIG.md) or the main [README.md](README.md).
