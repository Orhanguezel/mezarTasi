import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsSubCategories } from "../Tabs/SubCategoriesTab"; // RTK sürümü (aşağıda)

export function SubCategoriesCard() {
  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">Alt Kategoriler</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <TabsSubCategories />
      </CardContent>
    </Card>
  );
}
