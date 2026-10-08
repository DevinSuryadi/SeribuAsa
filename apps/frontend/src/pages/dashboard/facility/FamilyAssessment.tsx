import { Navigate, useParams } from "react-router-dom";

// Preserve bookmarks from the former separate assessment page.
export default function FamilyAssessmentRedirect() {
  const { familyId } = useParams<{ familyId: string }>();
  return <Navigate to={familyId ? `/dashboard/health-facility/families/${familyId}` : "/dashboard/health-facility/families"} replace />;
}
