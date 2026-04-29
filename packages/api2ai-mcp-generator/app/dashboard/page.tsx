import { OpenAPIDesigner } from '@/components/openapi-designer';

export const metadata = {
  title: 'OpenAPI Designer',
  description: 'Visual editor for creating and editing OpenAPI 3.x specifications',
};

export default function OpenAPIDesignerPage() {
  return <OpenAPIDesigner />;
}
