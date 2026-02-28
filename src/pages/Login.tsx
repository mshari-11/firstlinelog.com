/*
 * صفحة تسجيل دخول المناديب/السائقين - FirstLine Logistics
 * OTP temporarily disabled - using email + password
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Eye, EyeOff, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
