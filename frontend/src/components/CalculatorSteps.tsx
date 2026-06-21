import type { CarbonInput, CarFuel, DietType } from "../lib/types";
import {
  MAX_KM_PER_WEEK,
  MAX_KWH_PER_MONTH,
  MAX_FLIGHTS_PER_YEAR,
  MAX_USD_PER_MONTH,
  MAX_WASTE_KG_PER_WEEK,
  MAX_HOUSEHOLD_SIZE,
} from "../lib/constants";
import { NumberField } from "./NumberField";

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "heavy_meat", label: "Heavy meat eater" },
  { value: "medium_meat", label: "Average meat eater" },
  { value: "low_meat", label: "Low meat" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const FUEL_OPTIONS: { value: CarFuel; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

export function StepTransport({
  input,
  patchTransport,
}: {
  input: CarbonInput;
  patchTransport: (patch: Partial<CarbonInput["transport"]>) => void;
}) {
  return (
    <fieldset>
      <legend>Transport & Mobility</legend>
      <NumberField
        id="car_km"
        label="Car distance per week (km)"
        max={MAX_KM_PER_WEEK}
        value={input.transport.car_km_per_week}
        onChange={(v) => patchTransport({ car_km_per_week: v })}
      />
      <div className="field">
        <label htmlFor="car_fuel">Car fuel type</label>
        <select
          id="car_fuel"
          value={input.transport.car_fuel}
          onChange={(e) => patchTransport({ car_fuel: e.target.value as CarFuel })}
        >
          {FUEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <NumberField
        id="transit_km"
        label="Public transit per week (km)"
        max={MAX_KM_PER_WEEK}
        value={input.transport.public_transit_km_per_week}
        onChange={(v) => patchTransport({ public_transit_km_per_week: v })}
      />
      <NumberField
        id="short_flights"
        label="Short-haul flights per year"
        max={MAX_FLIGHTS_PER_YEAR}
        step={1}
        value={input.transport.short_haul_flights_per_year}
        onChange={(v) => patchTransport({ short_haul_flights_per_year: v })}
      />
      <NumberField
        id="long_flights"
        label="Long-haul flights per year"
        max={MAX_FLIGHTS_PER_YEAR}
        step={1}
        value={input.transport.long_haul_flights_per_year}
        onChange={(v) => patchTransport({ long_haul_flights_per_year: v })}
      />
    </fieldset>
  );
}

export function StepHome({
  input,
  patchHome,
}: {
  input: CarbonInput;
  patchHome: (patch: Partial<CarbonInput["home"]>) => void;
}) {
  return (
    <fieldset>
      <legend>Home Energy</legend>
      <NumberField
        id="electricity"
        label="Electricity per month (kWh)"
        max={MAX_KWH_PER_MONTH}
        value={input.home.electricity_kwh_per_month}
        onChange={(v) => patchHome({ electricity_kwh_per_month: v })}
      />
      <NumberField
        id="gas"
        label="Natural gas per month (kWh)"
        max={MAX_KWH_PER_MONTH}
        value={input.home.natural_gas_kwh_per_month}
        onChange={(v) => patchHome({ natural_gas_kwh_per_month: v })}
      />
      <NumberField
        id="household"
        label="People in household"
        min={1}
        max={MAX_HOUSEHOLD_SIZE}
        step={1}
        hint="Home energy is shared across this many people."
        value={input.home.household_size}
        onChange={(v) => patchHome({ household_size: v })}
      />
    </fieldset>
  );
}

export function StepLifestyle({
  input,
  setInput,
  patchConsumption,
}: {
  input: CarbonInput;
  setInput: React.Dispatch<React.SetStateAction<CarbonInput>>;
  patchConsumption: (patch: Partial<CarbonInput["consumption"]>) => void;
}) {
  return (
    <fieldset>
      <legend>Diet &amp; consumption</legend>
      <div className="field">
        <label htmlFor="diet">Diet</label>
        <select
          id="diet"
          value={input.diet}
          onChange={(e) => setInput((p) => ({ ...p, diet: e.target.value as DietType }))}
        >
          {DIET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <NumberField
        id="goods"
        label="Goods spending per month (USD)"
        max={MAX_USD_PER_MONTH}
        value={input.consumption.goods_spend_usd_per_month}
        onChange={(v) => patchConsumption({ goods_spend_usd_per_month: v })}
      />
      <NumberField
        id="waste"
        label="Landfill waste per week (kg)"
        max={MAX_WASTE_KG_PER_WEEK}
        value={input.consumption.waste_kg_per_week}
        onChange={(v) => patchConsumption({ waste_kg_per_week: v })}
      />
    </fieldset>
  );
}
