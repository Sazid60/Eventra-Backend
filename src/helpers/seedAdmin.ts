
import * as bcrypt from 'bcryptjs';


import config from '../config';
import { UserRole } from '@prisma/client';
import prisma from '../shared/prisma';



const seedSuperAdmin = async () => {
    try {
        const isExistSuperAdmin = await prisma.user.findFirst({
            where: {
                role: UserRole.ADMIN
            }
        });

        if (isExistSuperAdmin) {
            console.log("Admin already exists!")
            return;
        };

        const hashedPassword = await bcrypt.hash(config.admin_password, Number(config.salt_round))

        const superAdminData = await prisma.user.create({
            data: {
                email: config.admin_email,
                password: hashedPassword,
                role: UserRole.ADMIN,
                admin: {
                    create: {
                        name: "Admin",
                        //email: "super@admin.com",
                        contactNumber: "01234567890"
                    }
                }
            }
        });

        console.log("Super Admin Created Successfully!", superAdminData);
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await prisma.$disconnect();
    }
};

export default seedSuperAdmin;