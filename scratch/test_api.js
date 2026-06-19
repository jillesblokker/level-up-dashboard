require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');

// Read the actual schema from the file
const fs = require('fs');
