import { PrismaClient } from '../generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL,
  })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
