import type { Shift } from "@prisma/client";
import type { ChangeEvent } from "react";
import {
  startOfToday,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useRouter } from "next/router";
import type { NextPage } from "next/types";
import { useState } from "react";
import { useDebouncer } from "~/hooks/useDebouncer";
import { api } from "~/utils/api";

// get group information / display list of users for group / if userRole is admin - allow user to add/remove members to/from group

const Group: NextPage = () => {
  const groupId = useRouter().query.groupId as string;

  const isAdmin = api.groups.checkPermision.useQuery(groupId);

  const { data, isSuccess } = api.groups.getShifts.useQuery(groupId);

  if (!groupId) {
    return <div>404: group not found!</div>;
  }

  return (
    <>
      <div className="flex h-full w-full flex-col content-center bg-gradient-to-b from-slate-700 to-slate-800 p-3">
        <div className="ml-10 text-xl font-bold text-white">Members</div>
        <div className="flex h-full flex-col items-center">
          {isSuccess && <MemberList groupId={groupId} shifts={data} />}
          {isAdmin.data?.userRole === "ADMIN" && (
            <FindMember groupId={groupId} />
          )}
        </div>
        <text className="text-xl font-bold text-white">Shifts</text>
        <div className="flex h-full flex-col items-center">
          <ShiftGrid groupId={groupId} />
          {isAdmin.data?.userRole === "ADMIN" && (
            <CreateShift groupId={groupId} />
          )}
        </div>
      </div>
    </>
  );
};

export default Group;

const FindMember = (props: { groupId: string }) => {
  const [user, setUser] = useState("");
  const debounceUser = useDebouncer(user);
  const ctx = api.useContext();

  const { data, isSuccess, isFetching, error } = api.users.getUser.useQuery(
    debounceUser,
    {
      enabled: !!debounceUser,
    }
  );

  const { mutate } = api.groups.addToGroup.useMutation({
    onSuccess: () => {
      setUser("");
      void ctx.users.getGroupUsers.invalidate();
    },
  });

  const addMemberToGroup = () => {
    if (isSuccess) {
      mutate({ groupId: props.groupId, userId: data.id });
    }
  };

  return (
    <div className="flex">
      <label htmlFor="add-member" className="btn">
        Add Member
      </label>
      <input type="checkbox" id="add-member" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor="add-member"
            className="btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">Find a new member</h3>
          <div>
            <input
              type="email"
              placeholder="User name/email"
              value={user}
              className="input-bordered input-primary input w-96"
              onChange={(e) => setUser(e.target.value)}
            />
            <button className="btn-primary btn" onClick={addMemberToGroup}>
              Add Member
            </button>
          </div>
          <div>
            {isFetching && <div>Loading...</div>}
            {isSuccess ? (
              <div>{data.email}</div>
            ) : (
              <div className="text-red-500">
                <text>{error?.message}</text>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// List all current members of a group and assigned shifts
const MemberList = (props: { groupId: string; shifts: Shift[] }) => {
  const { data, isLoading } = api.users.getGroupUsers.useQuery(props.groupId);

  const today = startOfToday();

  const dates = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="m-6 h-full w-full flex-shrink rounded-lg bg-gradient-to-b from-slate-800 to-slate-700 px-10 pb-6 pt-3 shadow-inner md:max-w-screen-xl">
      <div className="pb-3 text-center text-lg font-semibold text-white">
        <h2>{format(today, "MMM yyyy")}</h2>
        <div className="my-3 w-full rounded border border-white"></div>
      </div>
      <div className="flex snap-x flex-col overflow-hidden rounded-lg bg-slate-300 hover:overflow-auto">
        <div className="flex flex-row">
          <div className="w-40 flex-none border-r border-b border-black bg-slate-300"></div>
          {dates.map((dayOfWeek) => (
            <div
              key={dayOfWeek.toString()}
              className="w-40 flex-none border-r border-black bg-slate-300 text-center text-sm font-semibold"
            >
              {format(dayOfWeek, "EEEE")}
            </div>
          ))}
        </div>
        {data?.map((member) => (
          <div key={member.id} className="flex flex-row">
            <div className="w-40 flex-none snap-start overflow-hidden border-b border-r border-black bg-slate-300 pt-10 text-center">
              <div className="text-md font-semibold">{member.name}</div>
              <div className="text-sm">{member.email}</div>
            </div>
            {dates.map((day) => (
              <div
                key={day.toString()}
                className="h-40 w-40 flex-none snap-start border-r border-b border-black bg-white"
              >
                <div>{day.getDate()}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateShift = (props: { groupId: string }) => {
  const [time, setTime] = useState({
    startTime: new Date(),
    endTime: new Date(),
  });

  const { mutate } = api.groups.createShift.useMutation();

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTime({ ...time, [e.target.id]: e.target.value });
  };

  return (
    <>
      <label htmlFor="shift-modal" className="btn">
        Create Shift
      </label>

      <input type="checkbox" id="shift-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box relative">
          <label
            htmlFor="shift-modal"
            className="btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">
            Create/Add a new shift for your group.
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutate({
                groupId: props.groupId,
                startDate: time.startTime,
                endDate: time.endTime,
              });
            }}
          >
            <input
              type="datetime-local"
              className="input-primary input"
              id="startTime"
              name="startTime"
              onChange={handleTimeChange}
            ></input>
            <input
              type="datetime-local"
              className="input-primary input"
              id="endTime"
              name="endTime"
              onChange={handleTimeChange}
            ></input>
            <button className="btn-primary btn" type="submit">
              Create Shift
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

const ShiftGrid = (props: { groupId: string }) => {
  const { data, isSuccess, isLoading } = api.groups.getShifts.useQuery(
    props.groupId
  );

  const today = startOfToday();

  const dates = eachDayOfInterval({
    start: startOfWeek(today),
    end: endOfWeek(today),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative m-6 flex h-full w-full flex-shrink justify-center rounded-lg bg-gradient-to-b from-slate-800 to-slate-700 px-10 pb-6 pt-3 shadow-inner">
      <div className="h-80 w-2/3 overflow-scroll rounded bg-slate-600">
        <div className="text-md grid grid-cols-8 content-center text-center font-bold">
          <div className="flex flex-col text-slate-400">
            <div className="h-12 bg-slate-500"></div>
            <div className="h-12">6 AM -</div>
            <div className="h-12">7 AM -</div>
            <div className="h-12">8 AM -</div>
            <div className="h-12">9 AM -</div>
            <div className="h-12">10 AM -</div>
            <div className="h-12">11 AM -</div>
            <div className="h-12">12 PM -</div>
            <div className="h-12">1 PM -</div>
            <div className="h-12">2 PM -</div>
            <div className="h-12">3 PM -</div>
            <div className="h-12">4 PM -</div>
            <div className="h-12">5 PM -</div>
            <div className="h-12">6 PM -</div>
            <div className="h-12">7 PM -</div>
            <div className="h-12">8 PM -</div>
            <div className="h-12">9 PM -</div>
            <div className="h-12">10 PM -</div>
            <div className="h-12">11 PM -</div>
            <div className="h-12">12 AM -</div>
          </div>
          {dates.map((day) => (
            <div key={day.toString()} className="flex flex-col">
              <div className="h-12 w-full self-center bg-slate-500 pt-3 text-white">
                {format(day, "E")}
              </div>
              <div className="relative z-0 grid grid-cols-1">
                {isSuccess &&
                  data
                    .filter((shift) => isSameDay(shift.startDate, day))
                    .map((time) => {
                      return (
                        <div
                          key={time.startDate.toString()}
                          style={{
                            gridRowStart: `${format(time.startDate, "h")}`,
                          }}
                          className="absolute z-10 h-48 w-full rounded bg-blue-500 bg-opacity-90 shadow-md"
                        >
                          <span>{format(time.startDate, "h aa")}</span>
                          <span>~</span>
                          <span>{format(time.endDate, "h aa")}</span>
                        </div>
                      );
                    })}
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
                <div className="h-12 border"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
