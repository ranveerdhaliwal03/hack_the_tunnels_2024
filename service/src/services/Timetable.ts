import { ScheduledEvent, Timetable } from "@prisma/client";
import { prisma } from "../db";
import { Result, Ok, Err } from "ts-results";
import { AccountService } from ".";

export const createTimetable = async (
  email: string,
  name: string,
  scheduledEventIds: string[],
): Promise<Result<Timetable, Error>> => {

  let scheduledEventIdsInts: number[] = []

  scheduledEventIds.forEach((element) => scheduledEventIdsInts.push(parseInt(element)));

  const scheduledEvents = await prisma.scheduledEvent.findMany({
    where: {
      id: { in: scheduledEventIdsInts }
    }
  })

  if (scheduledEvents.length > 1) {
    for (let i = 0; i < scheduledEvents.length; i++) {
      for (let j = i + 1; j < scheduledEvents.length; j++) {
        if (isConflictingTime(scheduledEvents[i], scheduledEvents[j])) {
          return Err(new Error("Courses have conflicting times."));
        }
      }
    }
  }

  const account = await AccountService.findByEmail(email);

  if (account === null) {
    return Err(new Error("Account not found"));
  }

  const timetable = await prisma.timetable.create({
    data: {
      name,
      account: {
        connect: {
          id: account.id,
        },
      },
      timetableEvents: {
        create: scheduledEventIds.map((id) => ({
          scheduledEvent: {
            connect: {
              id: parseInt(id),
            },
          },
        })),
      },
    },
  });

  return Ok(timetable);
};

export const getTimetableById = async (
  id: number,
): Promise<Result<Timetable, Error>> => {
  const timetable = await prisma.timetable.findUnique({
    where: {
      id,
    },
    include: {
      timetableEvents: {
        include: {
          scheduledEvent: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  if (timetable === null) {
    return Err(new Error("Timetable not found"));
  }

  return Ok(timetable);
};

export const getAccountTimetables = async (
  email: string,
): Promise<Result<Timetable[], Error>> => {
  const account = await AccountService.findByEmail(email);

  if (account === null) {
    return Err(new Error("Account not found"));
  }

  const timetables = await prisma.timetable.findMany({
    where: {
      accountId: account.id,
    },
    include: {
      timetableEvents: {
        include: {
          scheduledEvent: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  });

  return Ok(timetables);
};

function isConflictingTime(scheduledEvent: ScheduledEvent, scheduledEventOther: ScheduledEvent) {
  if (!scheduledEvent.days.split(',').some(r => scheduledEvent.days.split(',').includes(r))) {
    return false;
  }
  if (scheduledEvent.startTime == 'NA' || scheduledEventOther.startTime == 'NA') {
    return;
  }
  if (scheduledEvent.startTime <= scheduledEventOther.startTime) {
    if (scheduledEvent.endTime > scheduledEventOther.startTime) {
      return true;
    }
    return false;
  } else {
    if (scheduledEventOther.endTime > scheduledEvent.startTime) {
      return true;
    }
    return false;
  }
}