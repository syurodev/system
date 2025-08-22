/**
 * Date Utilities
 *
 * Common date formatting và manipulation functions
 * Hỗ trợ timezone và localization cho Vietnam
 * Sử dụng dayjs thay vì native Date
 */

import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend dayjs với plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Set Vietnamese locale
dayjs.locale("vi");

/**
 * Date formatting utilities
 */
export class DateUtil {
  private static readonly VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
  private static readonly VIETNAM_LOCALE = "vi-VN";

  /**
   * Get current Vietnam time
   */
  static nowInVietnam(): Dayjs {
    return dayjs().tz(this.VIETNAM_TIMEZONE);
  }

  /**
   * Format date theo định dạng Vietnam
   */
  static formatVietnamese(date: Dayjs | Date | string): string {
    return dayjs(date).tz(this.VIETNAM_TIMEZONE).format("DD/MM/YYYY");
  }

  /**
   * Format datetime đầy đủ
   */
  static formatDateTimeVietnamese(date: Dayjs | Date | string): string {
    return dayjs(date).tz(this.VIETNAM_TIMEZONE).format("DD/MM/YYYY HH:mm:ss");
  }

  /**
   * Format cho ISO string with Vietnam timezone
   */
  static toISOStringVietnam(date: Dayjs | Date | string): string {
    return dayjs(date).tz(this.VIETNAM_TIMEZONE).toISOString();
  }

  /**
   * Parse ISO string to Vietnam time
   */
  static fromISOString(isoString: string): Dayjs {
    return dayjs(isoString).tz(this.VIETNAM_TIMEZONE);
  }

  /**
   * Add days to date
   */
  static addDays(date: Dayjs | Date | string, days: number): Dayjs {
    return dayjs(date).add(days, "day");
  }

  /**
   * Add hours to date
   */
  static addHours(date: Dayjs | Date | string, hours: number): Dayjs {
    return dayjs(date).add(hours, "hour");
  }

  /**
   * Add months to date
   */
  static addMonths(date: Dayjs | Date | string, months: number): Dayjs {
    return dayjs(date).add(months, "month");
  }

  /**
   * Calculate the difference in days
   */
  static diffInDays(
    date1: Dayjs | Date | string,
    date2: Dayjs | Date | string
  ): number {
    return Math.abs(dayjs(date2).diff(dayjs(date1), "day"));
  }

  /**
   * Calculate difference in hours
   */
  static diffInHours(
    date1: Dayjs | Date | string,
    date2: Dayjs | Date | string
  ): number {
    return Math.abs(dayjs(date2).diff(dayjs(date1), "hour"));
  }

  /**
   * Get start of day
   */
  static startOfDay(date: Dayjs | Date | string): Dayjs {
    return dayjs(date).startOf("day");
  }

  /**
   * Get end of day
   */
  static endOfDay(date: Dayjs | Date | string): Dayjs {
    return dayjs(date).endOf("day");
  }

  /**
   * Get start of week (Monday)
   */
  static startOfWeek(date: Dayjs | Date | string): Dayjs {
    return dayjs(date).startOf("week").add(1, "day"); // dayjs week starts on Sunday, adjust to Monday
  }

  /**
   * Get start of month
   */
  static startOfMonth(date: Dayjs | Date | string): Dayjs {
    return dayjs(date).startOf("month");
  }

  /**
   * Get end of month
   */
  static endOfMonth(date: Dayjs | Date | string): Dayjs {
    return dayjs(date).endOf("month");
  }

  /**
   * Check if date is today
   */
  static isToday(date: Dayjs | Date | string): boolean {
    const today = this.nowInVietnam();
    return dayjs(date).tz(this.VIETNAM_TIMEZONE).isSame(today, "day");
  }

  /**
   * Check if date is in current week
   */
  static isThisWeek(date: Dayjs | Date | string): boolean {
    const today = this.nowInVietnam();
    const startWeek = this.startOfWeek(today);
    const endWeek = this.endOfDay(this.addDays(startWeek, 6));

    const targetDate = dayjs(date).tz(this.VIETNAM_TIMEZONE);
    return (
      targetDate.isSameOrAfter(startWeek) && targetDate.isSameOrBefore(endWeek)
    );
  }

  /**
   * Check if date is in current month
   */
  static isThisMonth(date: Dayjs | Date | string): boolean {
    const today = this.nowInVietnam();
    return dayjs(date).tz(this.VIETNAM_TIMEZONE).isSame(today, "month");
  }

  /**
   * Get relative time description (Vietnamese)
   */
  static getRelativeTime(date: Dayjs | Date | string): string {
    const targetDate = dayjs(date).tz(this.VIETNAM_TIMEZONE);
    const now = this.nowInVietnam();

    return targetDate.from(now);
  }
}

/**
 * Aquaculture-specific date utilities
 */
export class AquacultureDateUtil {
  /**
   * Calculate culture day (DOC - Day of Culture)
   */
  static calculateCultureDay(
    stockingDate: Dayjs | Date | string,
    currentDate?: Dayjs | Date | string
  ): number {
    const current = currentDate ? dayjs(currentDate) : DateUtil.nowInVietnam();
    return DateUtil.diffInDays(stockingDate, current) + 1; // +1 because day 1 is stocking day
  }

  /**
   * Calculate estimated harvest date based on target size and growth rate
   */
  static estimateHarvestDate(
    stockingDate: Dayjs | Date | string,
    targetSizeGrams: number,
    initialSizeGrams: number = 0.001, // PL size
    dailyGrowthRate: number = 0.8 // grams per day average
  ): Dayjs {
    const growthNeeded = targetSizeGrams - initialSizeGrams;
    const daysNeeded = Math.ceil(growthNeeded / dailyGrowthRate);

    return DateUtil.addDays(stockingDate, daysNeeded);
  }

  /**
   * Get feeding schedule times for a day
   */
  static getFeedingTimes(feedingPerDay: number): string[] {
    const times: string[] = [];

    if (feedingPerDay <= 0) return times;

    // Distribute feeding times from 6 AM to 6 PM
    const startHour = 6;
    const endHour = 18;
    const interval = (endHour - startHour) / (feedingPerDay - 1);

    for (let i = 0; i < feedingPerDay; i++) {
      const hour = startHour + i * interval;
      const hourInt = Math.floor(hour);
      const minute = Math.round((hour - hourInt) * 60);

      times.push(
        `${hourInt.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }

    return times;
  }

  /**
   * Check if it's optimal feeding time (avoid extreme weather hours)
   */
  static isOptimalFeedingTime(date: Dayjs | Date | string): boolean {
    const hour = dayjs(date).tz("Asia/Ho_Chi_Minh").hour();

    // Avoid very early morning (before 5 AM) and late night (after 10 PM)
    // Also avoid midday heat (11 AM - 2 PM) in hot seasons
    return (hour >= 5 && hour < 11) || (hour >= 14 && hour < 22);
  }

  /**
   * Get water quality measurement schedule
   */
  static getWaterQualitySchedule(): {
    parameter: string;
    times: string[];
    frequency: string;
  }[] {
    return [
      {
        parameter: "pH",
        times: ["06:00", "18:00"],
        frequency: "twice_daily",
      },
      {
        parameter: "dissolved_oxygen",
        times: ["05:00", "14:00", "20:00"],
        frequency: "thrice_daily",
      },
      {
        parameter: "temperature",
        times: ["06:00", "12:00", "18:00"],
        frequency: "thrice_daily",
      },
      {
        parameter: "salinity",
        times: ["06:00"],
        frequency: "daily",
      },
      {
        parameter: "ammonia",
        times: ["06:00"],
        frequency: "every_3_days",
      },
    ];
  }

  /**
   * Calculate optimal sampling dates for health assessment
   */
  static getHealthSamplingSchedule(
    stockingDate: Dayjs | Date | string,
    harvestDate: Dayjs | Date | string
  ): Dayjs[] {
    const totalDays = DateUtil.diffInDays(stockingDate, harvestDate);
    const samplingDates: Dayjs[] = [];

    // Sample every 2 weeks, starting from day 7
    let currentDay = 7;
    while (currentDay < totalDays) {
      samplingDates.push(DateUtil.addDays(stockingDate, currentDay));
      currentDay += 14; // Every 2 weeks
    }

    // Add final sampling 3 days before harvest
    const finalSampling = DateUtil.addDays(harvestDate, -3);
    if (
      !samplingDates.some((date) => dayjs(date).isSame(finalSampling, "day"))
    ) {
      samplingDates.push(finalSampling);
    }

    return samplingDates;
  }
}
