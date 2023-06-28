import { Shift } from "@prisma/client";
import {
  startOfToday,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
} from "date-fns";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import { ChangeEvent, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { useDebouncer } from "~/hooks/useDebouncer";
import { api } from "~/utils/api";

// get group information / display list of users for group / if userRole is admin - allow user to add/remove members to/from group

const Group: NextPage = () => {
  const groupId = useRouter().query.groupId as string;

  const isAdmin = api.groups.checkPermision.useQuery(groupId);

  const { data, isSuccess, isLoading } = api.groups.getShifts.useQuery(groupId);

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
          <ShiftTable groupId={groupId} />
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
  const { data, isSuccess, isLoading } = api.users.getGroupUsers.useQuery(
    props.groupId
  );

  const { mutate } = api.groups.assignToShift.useMutation();

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
          <div className="flex flex-row">
            <div
              key={member.id}
              className="w-40 flex-none snap-start overflow-hidden border-b border-r border-black bg-slate-300 pt-10 text-center"
            >
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
    /*
      {isSuccess &&
        data.map((user) => (
          <div key={user.id} className="flex h-1/2 w-full flex-row">
            <div className="border-round absolute sticky left-0 flex flex min-h-full w-40 flex-col items-center justify-center bg-gray-200">
              <text className="text-sm font-bold">{user.name}</text>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const selectData = new FormData(e.currentTarget);
                  const id = selectData.get("shift") as string;
                  mutate({ userId: user.id, shiftId: id });
                }}
              >
                <select
                  className="select-ghost select select-xs"
                  defaultValue={"add shift"}
                  name="shift"
                >
                  <option value="add shift">Add Shift</option>
                  {props.shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.startDate.toLocaleDateString("en")}
                    </option>
                  ))}
                </select>
                <button type="submit">test</button>
              </form>
            </div>
                  */
  );
};

// filter by day of the week / display shift date in local string for readability
const FilterShift = (props: { data: Shift[]; day: number }) => {
  const shifts = useMemo(
    () => props.data?.filter((date) => date.startDate.getDay() === props.day),
    [props.data, props.day]
  );

  return (
    <div>
      <ul>
        {shifts.map((shift) => (
          <div className="flex flex-row space-x-8">
            <li>{shift.startDate.toLocaleString("en-us")}</li>
            <li>{shift.endDate.toLocaleString("en-us")}</li>
          </div>
        ))}
      </ul>
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

const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat"];

const ShiftTable = (props: { groupId: string }) => {
  const { data, isSuccess, isLoading } = api.groups.getShifts.useQuery(
    props.groupId
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="m-6 flex h-full w-full flex-shrink justify-center rounded-lg bg-gradient-to-b from-slate-800 to-slate-700 px-10 pb-6 pt-3 shadow-inner">
      <div className="h-80 w-2/3 overflow-auto bg-slate-600">
        <div className="text-md relative grid grid-cols-7 content-center overflow-auto text-center font-bold">
          {dayOfWeek.map((day, i) => (
            <>
              <div className="h-12 self-center bg-slate-500 pt-3 text-white">
                {day}
              </div>
              <div className="absolute row-start-5">is it working?</div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
              <div className="h-12 w-auto border"></div>
            </>
          ))}
        </div>
        {/*
        <div className="grid grid-cols-8">
          {data?.filter((shift) => isSameDay(shift.startDate, 1)).toString()}
          <div className="justify-self-end text-slate-300">6 AM</div>
          <div className="h-12 border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="justify-self-end text-slate-300">7 AM</div>
          <div className="h-12 border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="justify-self-end text-slate-300">8 AM</div>
          <div className="h-12 border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="justify-self-end text-slate-300">9 AM</div>
          <div className="h-12 border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="justify-self-end text-slate-300">10 AM</div>
          <div className="h-12 border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
          <div className="border"></div>
        </div>
          */}
      </div>
    </div>
  );
};
