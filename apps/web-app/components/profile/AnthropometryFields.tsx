"use client";

import { CLOTHING_SIZES } from "@/lib/clothing-sizes";
import { FieldCaption, FieldInput, FieldLabel, FieldSelect } from "@/components/ui/fields";

export type AnthropometryFieldValues = {
  heightCm: string;
  bustCm: string;
  waistCm: string;
  hipsCm: string;
  clothingSize: string;
  shoeSizeEu: string;
};

type AnthropometryFieldsProps = AnthropometryFieldValues & {
  required?: boolean;
  onChange: (field: keyof AnthropometryFieldValues, value: string) => void;
};

export default function AnthropometryFields({
  required = false,
  onChange,
  heightCm,
  bustCm,
  waistCm,
  hipsCm,
  clothingSize,
  shoeSizeEu,
}: AnthropometryFieldsProps) {
  const mark = required ? " *" : "";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <FieldLabel htmlFor="anthro-height">
        <FieldCaption>Рост, см{mark}</FieldCaption>
        <FieldInput
          id="anthro-height"
          inputMode="numeric"
          placeholder="170"
          required={required}
          value={heightCm}
          onChange={(event) => onChange("heightCm", event.target.value)}
        />
      </FieldLabel>
      <FieldLabel htmlFor="anthro-bust">
        <FieldCaption>Грудь, см{mark}</FieldCaption>
        <FieldInput
          id="anthro-bust"
          inputMode="numeric"
          placeholder="90"
          required={required}
          value={bustCm}
          onChange={(event) => onChange("bustCm", event.target.value)}
        />
      </FieldLabel>
      <FieldLabel htmlFor="anthro-waist">
        <FieldCaption>Талия, см{mark}</FieldCaption>
        <FieldInput
          id="anthro-waist"
          inputMode="numeric"
          placeholder="70"
          required={required}
          value={waistCm}
          onChange={(event) => onChange("waistCm", event.target.value)}
        />
      </FieldLabel>
      <FieldLabel htmlFor="anthro-hips">
        <FieldCaption>Бёдра, см{mark}</FieldCaption>
        <FieldInput
          id="anthro-hips"
          inputMode="numeric"
          placeholder="98"
          required={required}
          value={hipsCm}
          onChange={(event) => onChange("hipsCm", event.target.value)}
        />
      </FieldLabel>
      <FieldLabel htmlFor="anthro-clothing">
        <FieldCaption>Размер одежды</FieldCaption>
        <FieldSelect
          id="anthro-clothing"
          value={clothingSize}
          onChange={(event) => onChange("clothingSize", event.target.value)}
        >
          {CLOTHING_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </FieldSelect>
      </FieldLabel>
      <FieldLabel htmlFor="anthro-shoe">
        <FieldCaption>Обувь, EU</FieldCaption>
        <FieldInput
          id="anthro-shoe"
          inputMode="numeric"
          placeholder="38"
          value={shoeSizeEu}
          onChange={(event) => onChange("shoeSizeEu", event.target.value)}
        />
      </FieldLabel>
    </div>
  );
}
