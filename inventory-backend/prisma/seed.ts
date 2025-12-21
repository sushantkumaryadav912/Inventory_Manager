import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding dev user...');

    const devUserId = 'dev-user';
    const devEmail = 'dev@aerosy.in';
    const devName = 'Dev User';

    // 1. Create User
    const user = await prisma.users.upsert({
        where: { id: devUserId },
        update: {
            email: devEmail,
            name: devName,
        },
        create: {
            id: devUserId,
            email: devEmail,
            name: devName,
        },
    });

    console.log({ user });

    // 2. Create Shop
    const shop = await prisma.shops.create({
        data: {
            name: 'Dev Shop',
            business_type: 'dev-test',
            user_shops: {
                create: {
                    user_id: user.id,
                    role: 'OWNER',
                },
            },
            // create inventory categories etc if needed
        },
    });

    console.log({ shop });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
