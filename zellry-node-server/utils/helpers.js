module.exports = {
  convertToSlug: (Text) => {
    return Text.toLowerCase()
      .replace(/ /g, "_")
      .replace(/[^\w-]+/g, "");
  },

  deal_status: [
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
    },
    {
      value: 3,
      label: "Cancel Deal",
      ref: "deal_status",
    },
  ],
  months: [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ],

  dynamicSort: (key, order = "asc") => {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }

      const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
      const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return order === "desc" ? comparison * -1 : comparison;
    };
  },
};