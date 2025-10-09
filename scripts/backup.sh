#!/bin/bash

# Script de backup automático para PostgreSQL
# Configuração para uso em container Docker

set -e

# Variáveis de ambiente
DB_HOST=${POSTGRES_HOST:-postgres}
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_PASSWORD=${POSTGRES_PASSWORD}
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

log "Iniciando backup do banco de dados: $DB_NAME"

# Executar backup
export PGPASSWORD="$DB_PASSWORD"
if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    log "Backup criado com sucesso: $BACKUP_FILE"
    
    # Comprimir backup
    if gzip "$BACKUP_FILE"; then
        log "Backup comprimido: ${BACKUP_FILE}.gz"
        BACKUP_FILE="${BACKUP_FILE}.gz"
    fi
    
    # Remover backups antigos (manter apenas os últimos 7 dias)
    find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +7 -delete
    log "Backups antigos removidos (mantidos últimos 7 dias)"
    
    # Verificar tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Tamanho do backup: $BACKUP_SIZE"
    
else
    log "ERRO: Falha ao criar backup"
    exit 1
fi

log "Backup concluído com sucesso"