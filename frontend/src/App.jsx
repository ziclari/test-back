import React, { useEffect, useState } from "react";
import SceneRenderer from "./CORE/render/sceneRenderer";
import LoginGate from "./CORE/auth/moodle-login/loginGate";
import { loadModuleManifest } from "./CORE/resources/loadModuleManifest";
import { loadCssDynamically } from "./CORE/resources/loadCssDynamically";
import { resolveInitialScene } from "./CORE/resources/sceneLogic";
import { getPath } from "./CORE/config-parser/getPath";
import { updateHeadFromManifest } from "./CORE/resources/updateHeadFromManifest";

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [initialScene, setInitialScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState(null); // <-- estado de error

  const getParams = async (m) => {
    const params = new URLSearchParams(location.search);
    const prefix = params.get("prefix");
    const courseId = params.get("course_id");
    const user = params.get("user");
    // Verificar que todos los parámetros existan
    if ((!prefix || !courseId || !user) && m.meta.requireLogin) {
      throw new Error("Por favor, inicie desde Moodle");
    }

    sessionStorage.setItem("prefix", prefix);
    sessionStorage.setItem("courseId", courseId);
    sessionStorage.setItem("userId", user);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const m = await loadModuleManifest(getPath("manifest.yaml"));
        setManifest(m);

        updateHeadFromManifest(m.meta);
        
        await getParams(m);

        // Cargar CSS del manifest
        if (m.meta?.skin) {
          loadCssDynamically(getPath(m.meta.skin));
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    init();
  }, []);

  // Resolver escena inicial cuando la sesión está lista
  useEffect(() => {
    if (!sessionReady || !manifest) return;

    const file = resolveInitialScene(manifest, assignments);
    setInitialScene(getPath(file));
  }, [sessionReady, manifest, assignments]);

  // Renderizado
  if (loading) return <div>Cargando simulador…</div>;

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "red", textAlign: "center" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!sessionReady)
    return (
      <LoginGate
        requireLogin={manifest.meta.requireLogin}
        onReady={({ assignments }) => {
          setAssignments(assignments);
          setSessionReady(true);
        }}
      />
    );

  if (!initialScene) return <div>Cargando escena inicial…</div>;

  return <SceneRenderer initialScene={initialScene} />;
}
