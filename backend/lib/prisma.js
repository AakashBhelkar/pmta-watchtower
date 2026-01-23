/**
 * PrismaClient Singleton
 *
 * This module exports a single PrismaClient instance to be shared across
 * the entire application. This prevents creating multiple database connections
 * and ensures proper connection pooling.
 */

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error']
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

module.exports = prisma;
