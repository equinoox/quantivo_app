import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { getFinanceGraphRows } from "@/features/finance/domain/finance-insights";
import { FinanceInsightEntry } from "@/features/finance/types/finance.types";
import { AppCard } from "@/shared/components/ui/AppCard";

type FinanceLineGraphProps = {
  chartWidth: number;
  entries: FinanceInsightEntry[];
  formatMoney: (value: number) => string;
  t: (key: string) => string;
};

export function FinanceLineGraph({ chartWidth, entries, formatMoney, t }: FinanceLineGraphProps) {
  const chartRows = getFinanceGraphRows(entries);
  const maxValue = Math.max(1, ...chartRows.map((row) => Math.max(row.revenues, row.expenses)));
  const width = Math.max(280, chartWidth);
  const height = 176;
  const left = 20;
  const top = 16;
  const plotWidth = width - 40;
  const plotHeight = 118;
  const getX = (index: number) => left + (chartRows.length <= 1 ? plotWidth / 2 : (index / (chartRows.length - 1)) * plotWidth);
  const getY = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const revenuePoints = chartRows.map((row, index) => `${getX(index)},${getY(row.revenues)}`).join(" ");
  const expensePoints = chartRows.map((row, index) => `${getX(index)},${getY(row.expenses)}`).join(" ");
  const totalRevenues = chartRows.reduce((total, row) => total + row.revenues, 0);
  const totalExpenses = chartRows.reduce((total, row) => total + row.expenses, 0);

  return (
    <AppCard className="border-primary bg-white">
      <View className="gap-3">
        <Svg height={height} viewBox={`0 0 ${width} ${height}`} width="100%">
          <Line stroke="#d8c8ab" strokeWidth={1} x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} />
          <Line stroke="#d8c8ab" strokeWidth={1} x1={left} x2={left} y1={top} y2={top + plotHeight} />
          <Polyline fill="none" points={revenuePoints} stroke="#15803d" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          <Polyline fill="none" points={expensePoints} stroke="#b91c1c" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
          {chartRows.map((row, index) => <Circle key={`revenue-${row.dateKey}`} cx={getX(index)} cy={getY(row.revenues)} fill="#15803d" r={3.5} />)}
          {chartRows.map((row, index) => <Circle key={`expense-${row.dateKey}`} cx={getX(index)} cy={getY(row.expenses)} fill="#b91c1c" r={3.5} />)}
        </Svg>
        <View className="flex-row flex-wrap gap-3">
          <Text className="text-sm font-semibold text-green-700">{t("revenue")}: {formatMoney(totalRevenues)}</Text>
          <Text className="text-sm font-semibold text-red-700">{t("expense")}: {formatMoney(totalExpenses)}</Text>
        </View>
        {chartRows.length > 0 ? <Text className="text-xs text-muted">{chartRows[0].dateKey} - {chartRows[chartRows.length - 1].dateKey}</Text> : null}
      </View>
    </AppCard>
  );
}
