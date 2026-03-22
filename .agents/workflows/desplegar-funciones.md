---
description: Cómo desplegar funciones de Supabase Edge
---

Para que el sistema de invitaciones funcione, debes subir el código a tu proyecto de Supabase siguiendo estos pasos:

1. Abre una terminal (PowerShell o CMD) en la carpeta raíz del proyecto.
2. Inicia sesión en Supabase (si no lo has hecho):
   ```bash
   npx supabase login
   ```
3. Vincula el proyecto (usa el código de referencia `gbozzxizkuiqycdirsln`):
   ```bash
   npx supabase link --project-ref gbozzxizkuiqycdirsln
   ```
   *Nota: Te pedirá la contraseña de la base de datos que configuraste al crear el proyecto.*
4. Despliega la función de invitaciones:
   ```bash
   npx supabase functions deploy invite-member
   ```

Una vez completado, el botón de "**Enviar Invitación**" en el panel de equipo ya enviará correos reales a tus nuevos miembros.
