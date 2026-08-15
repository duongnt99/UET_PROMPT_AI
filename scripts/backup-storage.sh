#!/usr/bin/env bash
set -euo pipefail

echo "Object storage backup"
echo "Use the provider CLI for the configured S3-compatible bucket."
echo "MinIO example:"
echo "  mc alias set local http://localhost:9000 minioadmin minioadmin"
echo "  mc mirror local/promptoff ./storage-backups/\$(date -u +%Y%m%dT%H%M%SZ)"
echo "AWS example:"
echo "  aws s3 sync s3://\$S3_BUCKET ./storage-backups/\$(date -u +%Y%m%dT%H%M%SZ)"
