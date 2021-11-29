import {
  addDays,
  endOfDay,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  addYears
} from "date-fns";
export const appendScript = (scriptToAppend) => {
  const script = document.createElement("script");
  script.src = scriptToAppend;
  script.async = true;
  document.body.appendChild(script);
};

export const removeScript = (scriptToremove) => {
  let allsuspects = document.getElementsByTagName("script");
  for (let i = allsuspects.length; i >= 0; i--) {
    if (
      allsuspects[i] &&
      allsuspects[i].getAttribute("src") !== null &&
      allsuspects[i].getAttribute("src").indexOf(`${scriptToremove}`) !== -1
    ) {
      allsuspects[i].parentNode.removeChild(allsuspects[i]);
    }
  }
};


export const fieldTypes = [
  {
    value:"Text",
    label:"Text"
  },
  {
    value:"Number",
    label:"Number",
  },
  {
    value:"Choice",
    label:"Choice",
  },
  {
    value:"Inherit",
    label:"Inherit",
  },
  {
    value:"Phone",
    label:"Phone",
  },
  {
    value:"Email",
    label:"Email",
  },
  {
    value:"Date",
    label:"Date",
  },
  {
    value:"Label",
    label:"Label",
  }
];

export const deal_status = [
  {
    value: 1,
    label: "Won Deal",
    ref: "deal_status",
  },
  {
    value: 0,
    label: "Lost Deal",
    ref: "deal_status",
  },
  {
    value: 2,
    label: "Pending Deal",
    ref: "deal_status",
  }
];

// Date Range Picker
const defineds = {
  startOfWeek: startOfWeek(new Date()),
  endOfWeek: endOfWeek(new Date()),
  startOfLastWeek: startOfWeek(addDays(new Date(), -7)),
  endOfLastWeek: endOfWeek(addDays(new Date(), -7)),
  startOfToday: startOfDay(new Date()),
  startOfLastSevenDay: startOfDay(addDays(new Date(), -7)),
  startOfLastThirtyDay: startOfDay(addDays(new Date(), -30)),
  startOfLastNintyDay: startOfDay(addDays(new Date(), -90)),
  endOfToday: endOfDay(new Date()),
  startOfYesterday: startOfDay(addDays(new Date(), -1)),
  endOfYesterday: endOfDay(addDays(new Date(), -1)),
  startOfMonth: startOfMonth(new Date()),
  endOfMonth: endOfMonth(new Date()),
  startOfLastMonth: startOfMonth(addMonths(new Date(), -1)),
  endOfLastMonth: endOfMonth(addMonths(new Date(), -1)),
  startOfYear: startOfYear(new Date()),
  endOfYear: endOfYear(new Date()),
  startOflastYear: startOfYear(addYears(new Date(), -1)),
  endOflastYear: endOfYear(addYears(new Date(), -1))
};

export const DateStaticRanges = [
  {
    label: 'today',
    value: [defineds.startOfToday,defineds.endOfToday]
  },
  {
    label: 'yesterday',
    value: [defineds.startOfYesterday,defineds.startOfYesterday]
  },
  {
    label: 'This Week',
    value: [defineds.startOfWeek,defineds.endOfWeek]
  },
  {
    label: 'Last Week',
    value: [defineds.startOfLastWeek,defineds.endOfLastWeek]
  },
  {
    label: 'This Month',
    value: [defineds.startOfMonth, defineds.endOfMonth]
  },
  {
    label: 'Last Month',
    value: [defineds.startOfLastMonth, defineds.endOfLastMonth]
  }
];