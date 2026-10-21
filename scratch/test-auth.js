const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cdtqzdfxhustrnndinxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdHF6ZGZ4aHVzdHJubmRpbnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDQ2MDUsImV4cCI6MjEwNzIyMDYwNX0.wPZAf7wATcPTywiKuy5EXWO6P8gq3SEpb6j7-96buy4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'cyrille@izifacture.com',
    password: 'IziFacture2024!',
  });
  console.log('Data:', data);
  console.log('Error:', error);
}

testAuth();
