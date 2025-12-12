import axios from "axios";
import { K8S_ORCHESTRATOR_URL } from "@/config";
import ProjectWithInitRequest from "@/components/ProjectWithInitRequest";

interface Params {
	params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: Params) {
	const projectId = (await params).projectId
    const response = await axios.get(`${K8S_ORCHESTRATOR_URL}/worker/${projectId}`);
	const { sessionUrl, previewUrl, workerUrl } = response.data;

	return <ProjectWithInitRequest 
		projectId={projectId} 
		sessionUrl={sessionUrl} 
		previewUrl={previewUrl} 
		workerUrl={workerUrl} 
	/>
}
