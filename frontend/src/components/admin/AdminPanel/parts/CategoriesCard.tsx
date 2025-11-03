import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsCategories } from "../Tabs/CategoriesTab"; // RTK sürümü

export function CategoriesCard() {
  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Kategoriler</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <TabsCategories />
      </CardContent>
    </Card>
  );
}
