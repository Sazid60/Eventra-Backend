import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({})

// prisma.$on('query', (e: any) => {
//     console.log("___________________________________________")
//     console.log('Query: ' + e.query);
//     console.log("___________________________________________")
//     console.log('Params: ' + e.params)
//     console.log("___________________________________________")
//     console.log('Duration: ' + e.duration + 'ms')
//     console.log("___________________________________________")
// })

// prisma.$on('warn', (e) => {
//     console.log(e)
// })

// prisma.$on('info', (e) => {
//     console.log(e)
// })

// prisma.$on('error', (e) => {
//     console.log(e)
// })

export default prisma;