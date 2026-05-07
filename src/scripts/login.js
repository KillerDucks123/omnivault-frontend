import { createClient } from '@supabase/supabase-js';
import { navigate } from 'astro:transitions/client';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY
);

const form = document.getElementById('loginForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btnIngresar');
        const errorMsg = document.getElementById('errorMsg');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Verificando...';
        errorMsg.innerText = "";

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                errorMsg.innerText = "Error: Credenciales inválidas.";
                btn.disabled = false;
                btn.innerText = "Ingresar";
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            errorMsg.innerText = "Error de conexión.";
            btn.disabled = false;
            btn.innerText = "Ingresar";
        }
    });
}