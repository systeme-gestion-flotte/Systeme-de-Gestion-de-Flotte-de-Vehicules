FROM alpine:3.18
RUN apk add --no-cache postgresql-client
COPY seed_data.sql /seed_data.sql
# Attendre que Postgres soit prêt puis injecter les données
CMD ["sh", "-c", "echo 'Attente de la base de données...' && sleep 15 && PGPASSWORD=adminpassword psql -h postgres -U admin -d postgres -f /seed_data.sql && echo 'Le seeding est terminé !'"]
