import { RoundStatus } from "../hooks/useFilterRounds";
import { TimeFilterVariables } from "data-layer";

export const createISOTimestamp = (timestamp = 0) => {
  const NOW_IN_SECONDS = Date.now();
  return new Date(Math.floor(NOW_IN_SECONDS + timestamp)).toISOString();
};

const ONE_DAY_IN_MILISECONDS = 3600 * 24 * 1000;

function getStatusFilter(status: string): TimeFilterVariables {
  const currentTimestamp = createISOTimestamp();

  switch (status) {
    case RoundStatus.active:
      return {
        // Round must have started and not ended yet
        donationsStartTime: { _lt: currentTimestamp },
        _or: [
          { donationsEndTime: { _gt: currentTimestamp } },
          { donationsEndTime: { _isNull: true } },
        ],
      };
    case RoundStatus.taking_applications:
      return {
        applicationsStartTime: { _lte: currentTimestamp },
        applicationsEndTime: { _gte: currentTimestamp },
      };

    case RoundStatus.finished:
      return {
        donationsEndTime: { _lt: currentTimestamp },
      };
    case RoundStatus.ending_soon:
      return {
        donationsEndTime: {
          _gt: currentTimestamp,
          _lt: createISOTimestamp(ONE_DAY_IN_MILISECONDS * 30),
        },
      };
    default:
      return {};
  }
}

export function createRoundsStatusFilter(
  status: string
): TimeFilterVariables[] {
  // Default to all filters
  const selectedFilters =
    status.replace(",verified", "") ||
    [
      RoundStatus.active,
      RoundStatus.taking_applications,
      RoundStatus.finished,
    ].join(",");

  // Build a filter array: [activeFilter, takingApplicationsFilter]
  return selectedFilters?.split(",").filter(Boolean).map(getStatusFilter);
}
