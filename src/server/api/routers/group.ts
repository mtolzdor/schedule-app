import { create } from "domain";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  // get group and all members
  getGroup: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.group.findUnique({
        where: {
          id: input,
        },
        include: { users: true },
      });
    }),
  // Add a User to existing group
  addToGroup: protectedProcedure
    .input(z.object({ groupId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.group.update({
        where: {
          id: input.groupId,
        },
        data: {
          users: {
            create: {
              userId: input.userId,
              userRole: "USER",
            },
          },
        },
      });
    }),
  createShift: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.group.update({
        where: {
          id: input.groupId,
        },
        data: {
          Shift: {
            create: {
              startDate: input.startDate,
              endDate: input.endDate,
            },
          },
        },
      });
    }),
  getShifts: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.shift.findMany({
        where: {
          groupId: input,
        },
      });
    }),
  assignToShift: protectedProcedure
    .input(z.object({ shiftId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          shifts: {
            connect: {
              id: input.shiftId,
            },
          },
        },
        include: { shifts: true },
      });
    }),
  checkPermision: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await ctx.prisma.userGroups.findUnique({
        where: {
          userId_groupId: { userId: userId, groupId: input },
        },
        select: {
          userRole: true,
        },
      });
    }),
});
