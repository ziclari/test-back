#!/bin/bash
set -e

mkdir -p /opt/app

cp "$(dirname "$0")/.env_qa_inn_backend" /opt/app/.env_qa_inn_backend
chmod 600 /opt/app/.env_qa_inn_backend
