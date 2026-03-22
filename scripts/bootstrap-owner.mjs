import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ ERROR: Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Asegúrate de haberlas definido en tu archivo .env");
  process.exit(1);
}

// Inicializar cliente con Service Role Key para tener derechos administrativos (sobreescribir RLS y gestionar Auth)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EMAIL = 'Khouryromero@gmail.com';
const PASSWORD = 'Fab12.';
const ORG_NAME = 'SmartDental Principal';
const ORG_SLUG = 'smart-dental-main';

async function bootstrap() {
  console.log('🚀 Iniciando proceso de bootstrap del usuario Owner...\n');

  try {
    // 1. Verificar o Crear la Organización Principal
    console.log('🏢 1. Comprobando organización principal...');
    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', ORG_SLUG)
      .single();

    if (orgError && orgError.code !== 'PGRST116') {
      throw new Error(`Error al buscar la organización: ${orgError.message}`);
    }

    if (!org) {
      console.log('   Creando organización principal...');
      const { data: newOrg, error: newOrgError } = await supabase
        .from('organizations')
        .insert([{ 
          name: ORG_NAME, 
          slug: ORG_SLUG, 
          status: 'active'
        }])
        .select('id')
        .single();
      
      if (newOrgError) throw new Error(`Error al crear organización: ${newOrgError.message}`);
      org = newOrg;
      console.log(`   ✅ Organización creada (ID: ${org.id})`);
    } else {
      console.log(`   ✅ Organización existente encontrada (ID: ${org.id})`);
    }
    
    const orgId = org.id;

    // 2. Verificar o Crear el Usuario en Supabase Auth
    console.log('\n👤 2. Comprobando usuario administrador en Supabase Auth...');
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Error listando usuarios: ${listError.message}`);

    let user = users.find(u => u.email === EMAIL.toLowerCase());
    
    if (!user) {
      console.log('   Usuario no encontrado. Creando usuario en Auth...');
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: 'Admin Khoury' }
      });

      if (createError) throw new Error(`Error creando usuario Auth: ${createError.message}`);
      user = authData.user;
      console.log(`   ✅ Usuario creado en Auth (ID: ${user.id})`);
    } else {
      console.log('   El usuario ya existe en Auth. Actualizando contraseña y metadatos para asegurar el acceso...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          password: PASSWORD, 
          email_confirm: true, 
          user_metadata: { full_name: 'Admin Khoury' } 
        }
      );
      if (updateError) throw new Error(`Error actualizando usuario Auth: ${updateError.message}`);
      console.log(`   ✅ Usuario actualizado en Auth (ID: ${user.id})`);
    }

    const userId = user.id;

    // 3. Crear o Sincronizar Fila en public.profiles
    console.log('\n📝 3. Comprobando registro de perfil público (public.profiles)...');
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        email: EMAIL, 
        full_name: 'Admin Khoury'
      }, { onConflict: 'id' });

    if (profileUpsertError) throw new Error(`Error en upsert del perfil: ${profileUpsertError.message}`);
    console.log('   ✅ Perfil público sincronizado correctamente.');

    // 4. Crear o Actualizar Relación en public.organization_users
    console.log('\n🔗 4. Comprobando vinculación con la organización (role = owner)...');
    const { data: orgUser, error: orgUserCheckError } = await supabase
      .from('organization_users')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single();

    if (orgUserCheckError && orgUserCheckError.code !== 'PGRST116') {
      throw new Error(`Error al buscar relación de organización: ${orgUserCheckError.message}`);
    }

    if (!orgUser) {
      console.log('   Vinculando usuario a la organización como Owner...');
      const { error: linkError } = await supabase
        .from('organization_users')
        .insert([{
          organization_id: orgId,
          user_id: userId,
          role: 'owner',
          is_active: true
        }]);
      
      if (linkError) throw new Error(`Error vinculando organización: ${linkError.message}`);
      console.log('   ✅ Usuario vinculado exitosamente.');
    } else {
      console.log('   Usuario ya vinculado. Actualizando para asegurar role="owner" e is_active=true...');
      const { error: updateLinkError } = await supabase
        .from('organization_users')
        .update({ role: 'owner', is_active: true })
        .eq('organization_id', orgId)
        .eq('user_id', userId);
        
      if (updateLinkError) throw new Error(`Error actualizando vinculación: ${updateLinkError.message}`);
      console.log('   ✅ Vinculación actualizada.');
    }

    // 5. Validación Final
    console.log('\n✅ 5. Realizando validación final del sistema...');
    
    const { data: valUser } = await supabase.auth.admin.getUserById(userId);
    const { data: valProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();
    const { data: valLink } = await supabase.from('organization_users').select('role, is_active').eq('organization_id', orgId).eq('user_id', userId).single();

    if (valUser?.user?.id === userId && valProfile?.id === userId && valLink?.role === 'owner' && valLink?.is_active) {
      console.log('\n🎉 ================================================');
      console.log('🎉  BOOTSTRAP COMPLETADO CON ÉXITO');
      console.log('🎉 ================================================');
      console.log('El entorno está configurado corporativamente. Ya puedes iniciar sesión en la aplicación con:');
      console.log(`\n    Email:    ${EMAIL}`);
      console.log(`    Password: ${PASSWORD}`);
      console.log('\n🚀 Listo para despegar.');
    } else {
      console.error('\n⚠️ ATENCIÓN: La validación final ha detectado un problema de integridad.');
      console.dir({ 
        authExists: !!valUser?.user, 
        profileExists: !!valProfile, 
        linkExists: !!valLink,
        linkRole: valLink?.role,
        linkActive: valLink?.is_active
      });
      process.exit(1);
    }

  } catch (err) {
    console.error(`\n❌ ERROR CRÍTICO DURANTE EL BOOTSTRAP: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();
