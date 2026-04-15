import { ensurePropertySettings, getAllProperties, getPrimaryProperty } from "@/lib/settings";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ propertyId?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const properties = await getAllProperties();
  const fallbackProperty = await getPrimaryProperty();
  const selectedProperty =
    properties.find((property) => property.id === resolvedSearchParams.propertyId) ?? fallbackProperty;
  const data = await ensurePropertySettings(selectedProperty.id);

  return (
    <SettingsClient
      key={selectedProperty.id}
      property={data}
      properties={properties}
      selectedPropertyId={selectedProperty.id}
    />
  );
}
