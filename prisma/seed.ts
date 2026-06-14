import { PrismaClient, EventStatus, Gender, ShirtSize } from '../src/generated/prisma/client'
import type { Category, TimingPoint } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import 'dotenv/config'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
const LAST_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平']

function randomName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] +
    LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
}

function randomPhone() {
  return '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
}

function randomBirthDate() {
  const start = new Date(1970, 0, 1)
  const end = new Date(2005, 11, 31)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000)
}

function addSeconds(base: Date, seconds: number) {
  return new Date(base.getTime() + seconds * 1000)
}

async function main() {
  console.log('🌱 开始生成种子数据...')

  await prisma.timingRecord.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.athlete.deleteMany()
  await prisma.timingPoint.deleteMany()
  await prisma.category.deleteMany()
  await prisma.event.deleteMany()

  const eventDate = new Date()
  eventDate.setDate(eventDate.getDate() + 30)
  eventDate.setHours(7, 0, 0, 0)

  const raceStartTime = addMinutes(eventDate, 0)

  console.log('🏃 创建赛事...')
  const event = await prisma.event.create({
    data: {
      name: '2026 春季城市马拉松',
      date: eventDate,
      location: '市民广场',
      description: '穿越城市最美赛道，感受春天的气息！全马、半马、10公里、5公里欢乐跑，总有一个适合你。',
      status: EventStatus.IN_PROGRESS,
      categories: {
        create: [
          {
            name: '全马',
            distance: 42.195,
            capacity: 500,
            price: 200,
            startTime: raceStartTime,
          },
          {
            name: '半马',
            distance: 21.0975,
            capacity: 1000,
            price: 150,
            startTime: addMinutes(raceStartTime, 10),
          },
          {
            name: '10公里',
            distance: 10,
            capacity: 1500,
            price: 100,
            startTime: addMinutes(raceStartTime, 20),
          },
          {
            name: '5公里欢乐跑',
            distance: 5,
            capacity: 2000,
            price: 80,
            startTime: addMinutes(raceStartTime, 25),
          },
        ],
      },
      timingPoints: {
        create: [
          { name: '起点', distance: 0, order: 1, isStart: true, isFinish: false },
          { name: '5公里', distance: 5, order: 2, isStart: false, isFinish: false },
          { name: '10公里', distance: 10, order: 3, isStart: false, isFinish: false },
          { name: '半程点', distance: 21.0975, order: 4, isStart: false, isFinish: false },
          { name: '30公里', distance: 30, order: 5, isStart: false, isFinish: false },
          { name: '35公里', distance: 35, order: 6, isStart: false, isFinish: false },
          { name: '终点', distance: 42.195, order: 7, isStart: false, isFinish: true },
        ],
      },
    },
    include: {
      categories: true,
      timingPoints: true,
    },
  })

  const fullMarathon = event.categories.find((c: Category) => c.name === '全马')!
  const halfMarathon = event.categories.find((c: Category) => c.name === '半马')!
  const tenK = event.categories.find((c: Category) => c.name === '10公里')!
  const fiveK = event.categories.find((c: Category) => c.name === '5公里欢乐跑')!

  const startTP = event.timingPoints.find((tp: TimingPoint) => tp.isStart)!
  const tp5k = event.timingPoints.find((tp: TimingPoint) => tp.name === '5公里')!
  const tp10k = event.timingPoints.find((tp: TimingPoint) => tp.name === '10公里')!
  const halfTP = event.timingPoints.find((tp: TimingPoint) => tp.name === '半程点')!
  const tp30k = event.timingPoints.find((tp: TimingPoint) => tp.name === '30公里')!
  const tp35k = event.timingPoints.find((tp: TimingPoint) => tp.name === '35公里')!
  const finishTP = event.timingPoints.find((tp: TimingPoint) => tp.isFinish)!

  console.log('👥 创建选手和报名数据...')

  const shirtSizes = [ShirtSize.S, ShirtSize.M, ShirtSize.L, ShirtSize.XL]

  async function createAthleteWithRegistration(
    categoryId: string,
    bibStart: number,
    count: number,
    generateTiming: (idx: number) => { atFinish: boolean; paceVariation: number }
  ) {
    for (let i = 0; i < count; i++) {
      const name = randomName()
      const phone = randomPhone()
      const gender = Math.random() > 0.4 ? Gender.MALE : Gender.FEMALE
      const shirtSize = shirtSizes[Math.floor(Math.random() * shirtSizes.length)]
      const birthDate = randomBirthDate()
      const emergencyName = randomName()
      const emergencyPhone = randomPhone()

      const athlete = await prisma.athlete.create({
        data: {
          name,
          gender,
          birthDate,
          phone,
          emergencyContact: emergencyName,
          emergencyPhone,
        },
      })

      const registration = await prisma.registration.create({
        data: {
          athleteId: athlete.id,
          categoryId,
          bibNumber: bibStart + i,
          shirtSize,
        },
      })

      const { atFinish, paceVariation } = generateTiming(i)

      const basePace = 5 * 60 + paceVariation * 30

      let currentTime = addSeconds(raceStartTime, Math.floor(Math.random() * 30))

      await prisma.timingRecord.create({
        data: {
          registrationId: registration.id,
          timingPointId: startTP.id,
          timestamp: currentTime,
        },
      })

      currentTime = addSeconds(currentTime, Math.floor(basePace * 5 * (0.95 + Math.random() * 0.1)))
      await prisma.timingRecord.create({
        data: {
          registrationId: registration.id,
          timingPointId: tp5k.id,
          timestamp: currentTime,
        },
      })

      if (categoryId === fullMarathon.id || categoryId === halfMarathon.id || categoryId === tenK.id) {
        currentTime = addSeconds(currentTime, Math.floor(basePace * 5 * (0.95 + Math.random() * 0.15)))
        await prisma.timingRecord.create({
          data: {
            registrationId: registration.id,
            timingPointId: tp10k.id,
            timestamp: currentTime,
          },
        })
      }

      if (categoryId === fullMarathon.id || categoryId === halfMarathon.id) {
        currentTime = addSeconds(currentTime, Math.floor(basePace * 11.0975 * (0.95 + Math.random() * 0.2)))
        await prisma.timingRecord.create({
          data: {
            registrationId: registration.id,
            timingPointId: halfTP.id,
            timestamp: currentTime,
          },
        })
      }

      if (categoryId === fullMarathon.id) {
        currentTime = addSeconds(currentTime, Math.floor(basePace * 8.9025 * (0.95 + Math.random() * 0.25)))
        await prisma.timingRecord.create({
          data: {
            registrationId: registration.id,
            timingPointId: tp30k.id,
            timestamp: currentTime,
          },
        })

        currentTime = addSeconds(currentTime, Math.floor(basePace * 5 * (0.98 + Math.random() * 0.3)))
        await prisma.timingRecord.create({
          data: {
            registrationId: registration.id,
            timingPointId: tp35k.id,
            timestamp: currentTime,
          },
        })
      }

      if (atFinish) {
        let finishDistance = 0
        if (categoryId === fiveK.id) finishDistance = 0
        else if (categoryId === tenK.id) finishDistance = 0
        else if (categoryId === halfMarathon.id) finishDistance = 0
        else finishDistance = 7.195

        if (finishDistance > 0) {
          currentTime = addSeconds(currentTime, Math.floor(basePace * finishDistance * (0.98 + Math.random() * 0.35)))
        } else if (categoryId === fiveK.id) {
        } else if (categoryId === tenK.id) {
        } else if (categoryId === halfMarathon.id) {
        }

        await prisma.timingRecord.create({
          data: {
            registrationId: registration.id,
            timingPointId: finishTP.id,
            timestamp: currentTime,
          },
        })
      }
    }
  }

  await createAthleteWithRegistration(fullMarathon.id, 1001, 30, (i) => ({
    atFinish: i < 25,
    paceVariation: -1 + (i / 30) * 3,
  }))

  await createAthleteWithRegistration(halfMarathon.id, 2001, 50, (i) => ({
    atFinish: i < 45,
    paceVariation: -1 + (i / 50) * 3,
  }))

  await createAthleteWithRegistration(tenK.id, 3001, 40, (i) => ({
    atFinish: i < 38,
    paceVariation: -1 + (i / 40) * 3,
  }))

  await createAthleteWithRegistration(fiveK.id, 4001, 35, (i) => ({
    atFinish: i < 34,
    paceVariation: -1 + (i / 35) * 3,
  }))

  await prisma.event.create({
    data: {
      name: '2025 秋季城市马拉松',
      date: new Date('2025-10-20T07:00:00'),
      location: '滨江公园',
      description: '经典秋季赛事，感受江边的凉爽秋风。',
      status: EventStatus.COMPLETED,
      categories: {
        create: [
          { name: '半马', distance: 21.0975, capacity: 1000, price: 150, startTime: new Date('2025-10-20T07:10:00') },
          { name: '10公里', distance: 10, capacity: 1500, price: 100, startTime: new Date('2025-10-20T07:20:00') },
        ],
      },
      timingPoints: {
        create: [
          { name: '起点', distance: 0, order: 1, isStart: true, isFinish: false },
          { name: '5公里', distance: 5, order: 2, isStart: false, isFinish: false },
          { name: '10公里', distance: 10, order: 3, isStart: false, isFinish: false },
          { name: '终点', distance: 21.0975, order: 4, isStart: false, isFinish: true },
        ],
      },
    },
  })

  await prisma.event.create({
    data: {
      name: '2026 暑期欢乐跑',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      location: '体育中心',
      description: '夏日清凉欢乐跑，适合全家参与！',
      status: EventStatus.REGISTRATION_OPEN,
      categories: {
        create: [
          { name: '10公里', distance: 10, capacity: 800, price: 80 },
          { name: '5公里欢乐跑', distance: 5, capacity: 2000, price: 50 },
        ],
      },
      timingPoints: {
        create: [
          { name: '起点', distance: 0, order: 1, isStart: true, isFinish: false },
          { name: '5公里', distance: 5, order: 2, isStart: false, isFinish: false },
          { name: '终点', distance: 10, order: 3, isStart: false, isFinish: true },
        ],
      },
    },
  })

  console.log('✅ 种子数据生成完成！')
  console.log('📊 数据概览：')
  console.log(`  🏃 全马报名: 30人 (25人完赛)`)
  console.log(`  🏃 半马报名: 50人 (45人完赛)`)
  console.log(`  🏃 10公里报名: 40人 (38人完赛)`)
  console.log(`  🏃 5公里报名: 35人 (34人完赛)`)
  console.log(`  📅 赛事总数: 3场 (1场进行中, 1场已结束, 1场报名中)`)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
