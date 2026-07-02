docker run --name math-pace-postgres \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -d postgres:15