import { User } from "@prisma/client";
import { contextProps } from "@trpc/react-query/shared";
import { TRPCError } from "@trpc/server";
import { string, transformer, z, ZodLiteral } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  //Create a new group / group-user relation - add current user to the group
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await ctx.prisma.group.create({
        data: {
          name: input.name,
          email: input.email,
          users: {
            create: {
              userId: userId,
              userRole: "ADMIN",
            },
          },
        },
      });
    }),
  //get all data for current user
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: { shifts: true },
    });
  }),
  //find a user by email
  getUser: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          email: input,
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return user;
    }),
  // update current user fields
  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          email: input.email,
        },
      });
    }),
  //get all users assigned to a group
  getGroupUsers: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findMany({
        where: {
          groups: {
            some: {
              groupId: input,
            },
          },
        },
      });
    }),
  //Get all groups assigned to the current user
  getUserGroups: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.userGroups.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: { group: true },
    });
  }),
});
