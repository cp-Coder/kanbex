#!/bin/sh

# set -e: exit asap if a command exits with a non-zero status
# set -u: exit asap if an undefined variable is used
# set -x: print each command before executing it
# set -o pipefail: exit asap if a command in a pipe exits with a non-zero status
set -euxo pipefail

echo "pushing schema changes to database and generating prisma client"
pnpm db

echo "starting server"
pnpm dev