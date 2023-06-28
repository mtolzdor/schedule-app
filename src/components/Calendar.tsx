import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { useMemo } from "react";
import { api } from "~/utils/api";

export const Calendar = () => {
  const { data, isSuccess } = api.users.getMe.useQuery();

  const today = startOfToday();

  const dates = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  function getColStart(day: Date) {
    const startCol = getDay(day);
    return "col-start-" + startCol;
  }

  return (
    <div className="mx-auto max-w-md md:max-w-6xl">
      <div className="p-3 text-center text-lg font-semibold">
        <h2>{format(today, "MMM yyyy")}</h2>
      </div>
      <div className="mb-4 grid grid-cols-7 text-center text-sm font-semibold">
        <div>Sunday</div>
        <div>Monday</div>
        <div>Tuesday</div>
        <div>Wednesday</div>
        <div>Thursday</div>
        <div>Friday</div>
        <div>Saturday</div>
      </div>

      <div className="grid h-full grid-cols-7 justify-center bg-gray-300">
        {dates.map((day, i) => (
          <div
            className={`h-40 border bg-white ${i === 0 && getColStart(day)}`}
            key={day.toString()}
          >
            <div>{day.getDate()}</div>
            <div>
              {data?.shifts
                .filter((shift) => isSameDay(shift.startDate, day))
                .toString()}
            </div>
            {/* <div className="ease h-40 w-10 cursor-pointer overflow-auto border p-1 transition duration-500 hover:bg-gray-300 sm:w-20 md:w-auto lg:w-32 xl:w-40"></div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

const FilterShift = (props: { month: number; day: number }) => {
  const { data } = api.users.getMe.useQuery();

  const shifts = useMemo(
    () =>
      data?.shifts.filter(
        (date) =>
          date.startDate.getMonth() === props.month &&
          date.startDate.getDate() === props.day
      ),
    [data, props.day, props.month]
  );
  console.log(shifts);
  return (
    <div>
      {shifts?.map((shift) => (
        <div
          key={shift.id}
          className=" mb-1 rounded bg-primary p-1 text-sm text-white"
        >
          From: {shift.startDate.toLocaleDateString("en")}
          To: {shift.endDate.toLocaleDateString("en")}
        </div>
      ))}
    </div>
  );
};
