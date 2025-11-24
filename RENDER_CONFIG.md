# Render Configuration for ClearSight

## Overview

This guide covers deploying the ClearSight face recognition application to Render with MySQL database support. 

**Important Note:** Render does not offer managed MySQL databases. Render provides PostgreSQL databases natively. For MySQL, you'll need to use an external MySQL provider.

## Database Setup

### Option 1: External MySQL Provider (Required for MySQL)

Since Render doesn't offer MySQL, you'll need to use an external MySQL provider:

#### Recommended MySQL Providers:

**PlanetScale (Recommended for Render):**
- Free tier available
- Serverless MySQL platform
- Excellent performance and reliability
- Easy connection from Render
- Steps:
  1. Sign up at [planetscale.com](https://planetscale.com)
  2. Create a new database
  3. Get connection credentials from the dashboard
  4. Use the provided host, username, and password

**Railway:**
- Offers MySQL databases
- Simple setup and configuration
- Good integration options
- Steps:
  1. Sign up at [railway.app](https://railway.app)
  2. Create a new MySQL database
  3. Get connection details from the database dashboard
  4. Use the provided credentials

**AWS RDS MySQL:**
- Enterprise-grade reliability
- Highly scalable
- More complex setup
- Steps:
  1. Create RDS MySQL instance in AWS Console
  2. Configure security groups to allow Render's IP ranges
  3. Enable public accessibility (or use VPC peering)
  4. Get endpoint and credentials

**Google Cloud SQL:**
- Managed MySQL service
- Good performance
- Steps:
  1. Create Cloud SQL MySQL instance
  2. Configure authorized networks
  3. Enable public IP or use Cloud SQL Proxy
  4. Get connection details

**DigitalOcean Managed MySQL:**
- Simple and affordable
- Good performance
- Steps:
  1. Create managed MySQL database
  2. Add Render's IP to trusted sources
  3. Get connection details

### Option 2: Use Render PostgreSQL Instead

If you're flexible on the database type, consider using Render's native PostgreSQL:

1. **Create a PostgreSQL Database on Render:**
   - Log in to your Render dashboard
   - Click "New +" and select "Postgres"
   - Choose a name for your database
   - Select a region close to your web service
   - Click "Create Database"

2. **Update Application Code:**
   - Modify database.py to support PostgreSQL
   - Use `psycopg2` library instead of `mysql-connector-python`
   - Adjust SQL syntax for PostgreSQL compatibility

**Note:** This option requires code changes and is not covered in the current MySQL migration spec.

## Web Service Setup

### Build Command:
```bash
pip install --upgrade pip setuptools && pip install -r backend/requirements.txt
```

### Start Command:
```bash
python backend/app.py
```

### Environment Variables:

Configure these in your Render web service dashboard under "Environment":

#### Required Variables:

```
# Database Configuration
DATABASE_TYPE=mysql

# MySQL Connection (use values from your Render MySQL database)
MYSQL_HOST=your-database-host.render.com
MYSQL_PORT=3306
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_database_user
MYSQL_PASSWORD=your_database_password

# Application Configuration
SECRET_KEY=your-random-secret-key-here
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

#### Optional Variables:

```
# Connection Pool Configuration (defaults shown)
MYSQL_POOL_SIZE=5
MYSQL_POOL_RECYCLE=3600
```

### Important Notes:

1. **External Database:** Since you're using an external MySQL provider, ensure the database allows connections from the internet
2. **Security:** Never commit database credentials to your repository
3. **Auto-Deploy:** Enable auto-deploy from your Git repository for continuous deployment
4. **Health Checks:** Render will automatically check if your service is healthy on port 5000
5. **Connection Security:** Use SSL/TLS connections to your MySQL database when possible

## Python Version:
Render will auto-detect Python 3.13 (compatible with updated packages)

## Database Initialization

The application automatically initializes the database schema on first startup:

1. When your web service starts, it connects to MySQL
2. The `init_database()` function creates tables if they don't exist
3. Check the logs to verify successful initialization:
   ```
   Database initialized successfully
   ```

## Connecting External MySQL to Your Render Web Service

### Configuration Steps:

1. **Get MySQL Connection Details from Your Provider:**
   - Host (e.g., `aws.connect.psdb.cloud` for PlanetScale)
   - Port (typically 3306)
   - Database name
   - Username
   - Password

2. **Set Environment Variables in Render:**
   - Go to your web service in Render dashboard
   - Navigate to "Environment" tab
   - Add each variable individually:
   ```
   MYSQL_HOST=your-mysql-host.example.com
   MYSQL_PORT=3306
   MYSQL_DATABASE=clearsight_db
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   ```

3. **Enable SSL (if supported by provider):**
   - Some providers require SSL connections
   - Check your provider's documentation for SSL configuration
   - May need to download SSL certificates

### Using Environment Groups (Advanced):

1. Create an Environment Group in Render with your MySQL credentials
2. Link the environment group to your web service
3. This allows sharing database credentials across multiple services

### Provider-Specific Connection Examples:

**PlanetScale:**
```
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_DATABASE=your-database-name
MYSQL_USER=your-username
MYSQL_PASSWORD=pscale_pw_xxxxx
```

**Railway:**
```
MYSQL_HOST=containers-us-west-xxx.railway.app
MYSQL_PORT=6543
MYSQL_DATABASE=railway
MYSQL_USER=root
MYSQL_PASSWORD=xxxxx
```

**AWS RDS:**
```
MYSQL_HOST=your-instance.xxxxx.us-east-1.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_DATABASE=clearsight
MYSQL_USER=admin
MYSQL_PASSWORD=your-password
```

## Monitoring and Logs

### View Application Logs:
1. Go to your web service in Render dashboard
2. Click "Logs" tab
3. Monitor for:
   - Database connection success/failure
   - Schema initialization
   - API request handling

### View Database Metrics:
1. Go to your MySQL provider's dashboard
2. View metrics like:
   - Connection count
   - Query performance
   - Storage usage
3. Note: Metrics are managed by your MySQL provider, not Render

## Troubleshooting

### Connection Issues:

**Problem:** "Can't connect to MySQL server"
- **Solution:** Verify MYSQL_HOST is correct and accessible from the internet
- **Solution:** Check that DATABASE_TYPE is set to "mysql"
- **Solution:** Verify all MySQL environment variables are set correctly
- **Solution:** Ensure your MySQL provider allows connections from Render's IP addresses
- **Solution:** Check if SSL/TLS is required by your provider

**Problem:** "Access denied for user"
- **Solution:** Double-check MYSQL_USER and MYSQL_PASSWORD
- **Solution:** Ensure the user has proper permissions on the database

### Schema Issues:

**Problem:** "Table doesn't exist"
- **Solution:** Check logs for schema initialization errors
- **Solution:** Manually run schema initialization if needed
- **Solution:** Verify the database user has CREATE TABLE permissions

### Performance Issues:

**Problem:** Slow database queries
- **Solution:** Increase MYSQL_POOL_SIZE for more concurrent connections
- **Solution:** Consider upgrading your Render MySQL instance type
- **Solution:** Add indexes to frequently queried columns (already included in schema)

### Migration Issues:

**Problem:** Need to migrate data from SQLite
- **Solution:** See MYSQL_SETUP.md for data migration instructions
- **Solution:** Use the migration script before deploying to Render
- **Solution:** Consider using a staging environment first

## Scaling Considerations

### Horizontal Scaling:
- Render allows multiple instances of your web service
- MySQL connection pooling handles concurrent connections efficiently
- Monitor connection pool usage and adjust MYSQL_POOL_SIZE if needed

### Database Scaling:
- Start with your MySQL provider's free or starter tier
- Upgrade as your data grows
- Monitor storage usage and query performance through your provider's dashboard
- Consider read replicas for high-traffic applications (if supported by provider)
- PlanetScale offers automatic scaling with their serverless architecture

## Security Best Practices

1. **Use SSL/TLS:** Enable encrypted connections to your MySQL database
2. **Rotate Credentials:** Periodically update database passwords
3. **Limit Permissions:** Database user should only have necessary permissions (SELECT, INSERT, UPDATE, DELETE, CREATE)
4. **IP Whitelisting:** If your provider supports it, whitelist only Render's IP ranges
5. **Monitor Access:** Review database connection logs regularly through your provider's dashboard
6. **Environment Variables:** Store all credentials in Render environment variables, never in code

## Cost Optimization

1. **Right-size Your Database:** Start small and scale as needed
2. **Use Connection Pooling:** Reduces connection overhead (already implemented)
3. **Monitor Usage:** Track database storage and connection metrics
4. **Clean Old Data:** Implement data retention policies for recognition logs

## Additional Resources

### Render Documentation:
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Render Web Services](https://render.com/docs/web-services)

### MySQL Provider Documentation:
- [PlanetScale Documentation](https://planetscale.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [DigitalOcean Managed Databases](https://docs.digitalocean.com/products/databases/)

### ClearSight Documentation:
- [ClearSight MySQL Setup Guide](./MYSQL_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)