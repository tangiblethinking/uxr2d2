import { createFileRoute } from "@tanstack/react-router";
import { DocumentApp } from "@/components/ux/document-app";

export const Route = createFileRoute("/")({ component: DocumentApp });
