// CORE/auth/LoginGate.jsx
import React, { useEffect, useState } from "react";
import Login from "./login";
import { getAssignments, refreshSession } from "../../external-services/moodle-service/moodleService";
import { moodleApi } from "../../external-services/moodle-service/moodleApi";

export default function LoginGate({ requireLogin, onReady }) {
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [postLoginLoading, setPostLoginLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const verify = async () => {
      if (!requireLogin) {
        onReady({ assignments: [] });
        setLoading(false);
        return;
      }

      try {
        // Intenta refrescar sesión
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (refreshToken) await refreshSession();

        // Verifica sesión con backend
        const { data } = await moodleApi.get("/auth/check");

        if (data.ok) {
          setValid(true);

          // Obtener assignments
          const a = await getAssignments();
          setAssignments(a);

          onReady({ assignments: a });
        } else {
          setValid(false);
        }
      } catch {
        setValid(false);
      }

      setLoading(false);
    };

    verify();
  }, [requireLogin]);

  // 1. Estado inicial
  if (loading) return <div>Cargando sesión…</div>;

  // 2. Estado cuando NO hay sesión → mostrar Login
  if (!valid && !postLoginLoading) {
    return (
      <Login
        onSuccess={async () => {
          // Se logró login correctamente
          setPostLoginLoading(true);       // Mostrar mensaje success + loading
          
          try {
            const a = await getAssignments();
            setAssignments(a);
            onReady({ assignments: a });
            setValid(true);
          } finally {
            setPostLoginLoading(false);
          }
        }}
      />
    );
  }

  // 3. Estado después de login → loading bloqueante con mensaje "success"
  if (postLoginLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Inicio de sesión exitoso</h2>
        <p>Cargando datos del curso…</p>
      </div>
    );
  }

  // 4. Login validado
  return null;
}
