import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import { api } from "~/utils/api";

export const Calendar = () => {
  const { data } = api.users.getMe.useQuery();

  const today = startOfToday();

  const dates = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

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
        {dates.map((day) => (
          <div className="h-40 border bg-white" key={day.toString()}>
            <div>{day.getDate()}</div>
            <div>
              {data?.shifts
                .filter((shift) => isSameDay(shift.startDate, day))
                .toString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
