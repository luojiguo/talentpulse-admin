--
-- PostgreSQL database dump
--

\restrict agz1UtpJSwJcUz5NTZUgCGJcoFzkPRoZjx9B4A3uvjVLtoS5tg2nYmC95L5pbql

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(100),
    messages jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_type character varying(50),
    is_active boolean DEFAULT true,
    total_messages integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    last_message_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    session_duration integer DEFAULT 0,
    ai_model character varying(50),
    ai_prompt_template character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    rating integer,
    feedback text,
    tags jsonb DEFAULT '[]'::jsonb,
    attached_resources jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT ai_sessions_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT ai_sessions_session_type_check CHECK (((session_type)::text = ANY ((ARRAY['resume_optimization'::character varying, 'interview_prep'::character varying, 'career_advice'::character varying, 'job_search'::character varying, 'general'::character varying])::text[]))),
    CONSTRAINT ai_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.ai_sessions OWNER TO postgres;

--
-- Name: COLUMN ai_sessions.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.id IS '会话ID，自增主键';


--
-- Name: COLUMN ai_sessions.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.user_id IS '关联用户ID，级联删除';


--
-- Name: COLUMN ai_sessions.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.title IS '会话标题';


--
-- Name: COLUMN ai_sessions.messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.messages IS '会话消息，JSON格式存储数组';


--
-- Name: COLUMN ai_sessions.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.created_at IS '创建时间';


--
-- Name: COLUMN ai_sessions.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.updated_at IS '更新时间';


--
-- Name: COLUMN ai_sessions.session_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.session_type IS '会话类型';


--
-- Name: COLUMN ai_sessions.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.is_active IS '会话是否活跃';


--
-- Name: COLUMN ai_sessions.total_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.total_messages IS '消息总数';


--
-- Name: COLUMN ai_sessions.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.metadata IS '会话元数据，JSON格式';


--
-- Name: COLUMN ai_sessions.last_message_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.last_message_at IS '最后消息时间';


--
-- Name: COLUMN ai_sessions.session_duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.session_duration IS '会话时长（秒）';


--
-- Name: COLUMN ai_sessions.ai_model; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.ai_model IS '使用的AI模型';


--
-- Name: COLUMN ai_sessions.ai_prompt_template; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.ai_prompt_template IS 'AI提示模板';


--
-- Name: COLUMN ai_sessions.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.status IS '会话状态';


--
-- Name: COLUMN ai_sessions.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.rating IS '会话评分';


--
-- Name: COLUMN ai_sessions.feedback; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.feedback IS '会话反馈';


--
-- Name: COLUMN ai_sessions.tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.tags IS '会话标签，JSON数组';


--
-- Name: COLUMN ai_sessions.attached_resources; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_sessions.attached_resources IS '附加资源，JSON数组';


--
-- Name: ai_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_sessions_id_seq OWNER TO postgres;

--
-- Name: ai_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_sessions_id_seq OWNED BY public.ai_sessions.id;


--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    candidate_id integer NOT NULL,
    job_id integer NOT NULL,
    status character varying(20) DEFAULT 'New'::character varying,
    match_score integer DEFAULT 0,
    applied_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resume_id integer,
    cover_letter text,
    match_details jsonb DEFAULT '{}'::jsonb,
    status_history jsonb DEFAULT '[]'::jsonb,
    interview_count integer DEFAULT 0,
    offer_salary character varying(20),
    offer_benefits jsonb DEFAULT '[]'::jsonb,
    rejection_reason text,
    rejection_type character varying(20),
    last_activity_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['New'::character varying, 'Screening'::character varying, 'Interview'::character varying, 'Offer'::character varying, 'Rejected'::character varying, 'Hired'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: COLUMN applications.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.id IS '申请记录ID，自增主键';


--
-- Name: COLUMN applications.candidate_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.candidate_id IS '关联求职者ID，级联删除';


--
-- Name: COLUMN applications.job_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.job_id IS '关联职位ID，级联删除';


--
-- Name: COLUMN applications.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.status IS '申请状态：新申请、筛选中、面试中、已发Offer、已拒绝、已入职';


--
-- Name: COLUMN applications.match_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.match_score IS '匹配度分数，0-100';


--
-- Name: COLUMN applications.applied_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.applied_date IS '申请日期';


--
-- Name: COLUMN applications.resume_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.resume_id IS '关联简历ID';


--
-- Name: COLUMN applications.cover_letter; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.cover_letter IS '求职信';


--
-- Name: COLUMN applications.match_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.match_details IS '匹配详情，JSON格式';


--
-- Name: COLUMN applications.status_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.status_history IS '状态变更历史，JSON数组';


--
-- Name: COLUMN applications.interview_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.interview_count IS '面试次数';


--
-- Name: COLUMN applications.offer_salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.offer_salary IS '录用薪资';


--
-- Name: COLUMN applications.offer_benefits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.offer_benefits IS '录用福利，JSON数组';


--
-- Name: COLUMN applications.rejection_reason; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.rejection_reason IS '拒绝原因';


--
-- Name: COLUMN applications.rejection_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.rejection_type IS '拒绝类型';


--
-- Name: COLUMN applications.last_activity_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.last_activity_at IS '最后活动时间';


--
-- Name: COLUMN applications.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.created_at IS '创建时间';


--
-- Name: COLUMN applications.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.applications.updated_at IS '更新时间';


--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: candidate_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidate_user (
    id integer NOT NULL,
    user_id integer NOT NULL,
    is_verified boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.candidate_user OWNER TO postgres;

--
-- Name: TABLE candidate_user; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.candidate_user IS '求职者验证表，存储求职者的验证状态';


--
-- Name: COLUMN candidate_user.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidate_user.id IS '主键，自增ID';


--
-- Name: COLUMN candidate_user.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidate_user.user_id IS '用户ID，关联users表';


--
-- Name: COLUMN candidate_user.is_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidate_user.is_verified IS '是否已验证，求职者默认已验证';


--
-- Name: COLUMN candidate_user.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidate_user.created_at IS '创建时间';


--
-- Name: COLUMN candidate_user.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidate_user.updated_at IS '更新时间';


--
-- Name: candidate_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidate_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_user_id_seq OWNER TO postgres;

--
-- Name: candidate_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidate_user_id_seq OWNED BY public.candidate_user.id;


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    user_id integer NOT NULL,
    experience character varying(20),
    city character varying(50),
    expected_salary character varying(20),
    job_status character varying(20),
    bio text,
    job_type_preference jsonb DEFAULT '[]'::jsonb,
    work_mode_preference jsonb DEFAULT '[]'::jsonb,
    industry_preference jsonb DEFAULT '[]'::jsonb,
    location_preference jsonb DEFAULT '[]'::jsonb,
    current_salary character varying(20),
    salary_negotiable boolean DEFAULT false,
    notice_period character varying(20),
    can_start_date date,
    career_goal text,
    applied_jobs_count integer DEFAULT 0,
    viewed_jobs_count integer DEFAULT 0,
    matched_jobs_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    summary text,
    expected_salary_min integer,
    expected_salary_max integer,
    availability_status character varying(50) DEFAULT 'available'::character varying,
    preferred_locations character varying(255),
    CONSTRAINT candidates_job_status_check CHECK (((job_status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'hired'::character varying])::text[])))
);


ALTER TABLE public.candidates OWNER TO postgres;

--
-- Name: COLUMN candidates.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.id IS '求职者ID，自增主键';


--
-- Name: COLUMN candidates.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.user_id IS '关联用户ID，级联删除';


--
-- Name: COLUMN candidates.experience; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.experience IS '工作经验';


--
-- Name: COLUMN candidates.city; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.city IS '所在城市';


--
-- Name: COLUMN candidates.expected_salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.expected_salary IS '期望薪资';


--
-- Name: COLUMN candidates.job_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.job_status IS '求职状态：活跃、非活跃、已入职';


--
-- Name: COLUMN candidates.bio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.bio IS '个人简介';


--
-- Name: COLUMN candidates.job_type_preference; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.job_type_preference IS '工作类型偏好，JSON数组';


--
-- Name: COLUMN candidates.work_mode_preference; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.work_mode_preference IS '工作模式偏好（全职、兼职、远程等）';


--
-- Name: COLUMN candidates.industry_preference; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.industry_preference IS '行业偏好，JSON数组';


--
-- Name: COLUMN candidates.location_preference; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.location_preference IS '地点偏好，JSON数组';


--
-- Name: COLUMN candidates.current_salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.current_salary IS '当前薪资';


--
-- Name: COLUMN candidates.salary_negotiable; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.salary_negotiable IS '薪资是否可谈';


--
-- Name: COLUMN candidates.notice_period; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.notice_period IS '离职通知期';


--
-- Name: COLUMN candidates.can_start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.can_start_date IS '可入职日期';


--
-- Name: COLUMN candidates.career_goal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.career_goal IS '职业目标';


--
-- Name: COLUMN candidates.applied_jobs_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.applied_jobs_count IS '已申请职位数量';


--
-- Name: COLUMN candidates.viewed_jobs_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.viewed_jobs_count IS '已查看职位数量';


--
-- Name: COLUMN candidates.matched_jobs_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.matched_jobs_count IS '匹配职位数量';


--
-- Name: COLUMN candidates.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.created_at IS '创建时间';


--
-- Name: COLUMN candidates.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates.updated_at IS '更新时间';


--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidates_id_seq OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    industry character varying(50),
    size character varying(20),
    address character varying(255),
    description text,
    logo character varying(255),
    company_type character varying(50),
    establishment_date date,
    registered_capital character varying(50),
    social_credit_code character varying(18),
    company_website character varying(255),
    company_phone character varying(20),
    company_email character varying(100),
    is_verified boolean DEFAULT false,
    verification_date timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying,
    job_count integer DEFAULT 0,
    follower_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    business_license character varying(255),
    contact_info character varying(255),
    CONSTRAINT companies_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'banned'::character varying])::text[])))
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: COLUMN companies.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.id IS '公司ID，自增主键';


--
-- Name: COLUMN companies.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.name IS '公司名称';


--
-- Name: COLUMN companies.industry; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.industry IS '所属行业';


--
-- Name: COLUMN companies.size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.size IS '公司规模';


--
-- Name: COLUMN companies.address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.address IS '公司地址';


--
-- Name: COLUMN companies.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.description IS '公司描述';


--
-- Name: COLUMN companies.logo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.logo IS '公司Logo URL';


--
-- Name: COLUMN companies.company_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.company_type IS '公司类型（国企、民企、外企等）';


--
-- Name: COLUMN companies.establishment_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.establishment_date IS '成立时间';


--
-- Name: COLUMN companies.registered_capital; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.registered_capital IS '注册资本';


--
-- Name: COLUMN companies.social_credit_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.social_credit_code IS '统一社会信用代码';


--
-- Name: COLUMN companies.company_website; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.company_website IS '公司网站';


--
-- Name: COLUMN companies.company_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.company_phone IS '公司电话';


--
-- Name: COLUMN companies.company_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.company_email IS '公司邮箱';


--
-- Name: COLUMN companies.is_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.is_verified IS '公司认证状态';


--
-- Name: COLUMN companies.verification_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.verification_date IS '认证时间';


--
-- Name: COLUMN companies.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.status IS '公司状态';


--
-- Name: COLUMN companies.job_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.job_count IS '发布职位数量';


--
-- Name: COLUMN companies.follower_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.follower_count IS '关注者数量';


--
-- Name: COLUMN companies.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.created_at IS '创建时间';


--
-- Name: COLUMN companies.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.updated_at IS '更新时间';


--
-- Name: COLUMN companies.business_license; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.business_license IS '营业执照';


--
-- Name: COLUMN companies.contact_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.companies.contact_info IS '联系方式';


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    job_id integer NOT NULL,
    candidate_id integer NOT NULL,
    recruiter_id integer NOT NULL,
    last_message character varying(255),
    last_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    unread_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    total_messages integer DEFAULT 0,
    candidate_unread integer DEFAULT 0,
    recruiter_unread integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT conversations_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: COLUMN conversations.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.id IS '对话ID，自增主键';


--
-- Name: COLUMN conversations.job_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.job_id IS '关联职位ID，级联删除';


--
-- Name: COLUMN conversations.candidate_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.candidate_id IS '关联求职者ID，级联删除';


--
-- Name: COLUMN conversations.recruiter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.recruiter_id IS '关联招聘方ID，级联删除';


--
-- Name: COLUMN conversations.last_message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.last_message IS '最后一条消息内容';


--
-- Name: COLUMN conversations.last_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.last_time IS '最后一条消息时间';


--
-- Name: COLUMN conversations.unread_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.unread_count IS '未读消息数';


--
-- Name: COLUMN conversations.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.is_active IS '对话是否活跃';


--
-- Name: COLUMN conversations.total_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.total_messages IS '消息总数';


--
-- Name: COLUMN conversations.candidate_unread; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.candidate_unread IS '求职者未读消息数';


--
-- Name: COLUMN conversations.recruiter_unread; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.recruiter_unread IS '招聘方未读消息数';


--
-- Name: COLUMN conversations.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.status IS '对话状态';


--
-- Name: COLUMN conversations.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.created_at IS '创建时间';


--
-- Name: COLUMN conversations.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.updated_at IS '更新时间';


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interviews (
    id integer NOT NULL,
    application_id integer NOT NULL,
    interview_date date NOT NULL,
    interview_time time without time zone NOT NULL,
    location character varying(255) NOT NULL,
    interviewer_id integer NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    notes text,
    interview_round integer DEFAULT 1,
    interview_type character varying(20),
    interview_topic text,
    interview_duration integer DEFAULT 60,
    interviewer_name character varying(50),
    interviewer_position character varying(50),
    interview_materials jsonb DEFAULT '[]'::jsonb,
    interview_result character varying(20),
    interview_feedback text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interviews_interview_result_check CHECK (((interview_result)::text = ANY ((ARRAY['通过'::character varying, '未通过'::character varying, '待定'::character varying])::text[]))),
    CONSTRAINT interviews_interview_type_check CHECK (((interview_type)::text = ANY ((ARRAY['电话'::character varying, '视频'::character varying, '现场'::character varying])::text[]))),
    CONSTRAINT interviews_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.interviews OWNER TO postgres;

--
-- Name: COLUMN interviews.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.id IS '面试ID，自增主键';


--
-- Name: COLUMN interviews.application_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.application_id IS '关联申请记录ID，级联删除';


--
-- Name: COLUMN interviews.interview_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_date IS '面试日期';


--
-- Name: COLUMN interviews.interview_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_time IS '面试时间';


--
-- Name: COLUMN interviews.location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.location IS '面试地点';


--
-- Name: COLUMN interviews.interviewer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interviewer_id IS '面试官ID，关联招聘方ID';


--
-- Name: COLUMN interviews.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.status IS '面试状态：已安排、已完成、已取消';


--
-- Name: COLUMN interviews.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.notes IS '面试备注';


--
-- Name: COLUMN interviews.interview_round; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_round IS '面试轮次';


--
-- Name: COLUMN interviews.interview_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_type IS '面试类型';


--
-- Name: COLUMN interviews.interview_topic; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_topic IS '面试主题';


--
-- Name: COLUMN interviews.interview_duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_duration IS '面试时长（分钟）';


--
-- Name: COLUMN interviews.interviewer_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interviewer_name IS '面试官姓名';


--
-- Name: COLUMN interviews.interviewer_position; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interviewer_position IS '面试官职位';


--
-- Name: COLUMN interviews.interview_materials; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_materials IS '面试材料，JSON数组';


--
-- Name: COLUMN interviews.interview_result; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_result IS '面试结果';


--
-- Name: COLUMN interviews.interview_feedback; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.interview_feedback IS '面试反馈';


--
-- Name: COLUMN interviews.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.created_at IS '创建时间';


--
-- Name: COLUMN interviews.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.interviews.updated_at IS '更新时间';


--
-- Name: interviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interviews_id_seq OWNER TO postgres;

--
-- Name: interviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interviews_id_seq OWNED BY public.interviews.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    company_id integer NOT NULL,
    recruiter_id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text NOT NULL,
    salary character varying(50),
    location character varying(50) NOT NULL,
    experience character varying(20),
    degree character varying(20),
    type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    department character varying(50),
    work_mode character varying(20),
    job_level character varying(20),
    hiring_count integer DEFAULT 1,
    urgency character varying(20),
    required_skills jsonb DEFAULT '[]'::jsonb,
    preferred_skills jsonb DEFAULT '[]'::jsonb,
    benefits jsonb DEFAULT '[]'::jsonb,
    publish_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    expire_date timestamp with time zone,
    views_count integer DEFAULT 0,
    applications_count integer DEFAULT 0,
    match_rate integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT jobs_job_level_check CHECK (((job_level)::text = ANY ((ARRAY['初级'::character varying, '中级'::character varying, '高级'::character varying, '管理'::character varying])::text[]))),
    CONSTRAINT jobs_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT jobs_type_check CHECK (((type)::text = ANY ((ARRAY['全职'::character varying, '兼职'::character varying, '实习'::character varying])::text[]))),
    CONSTRAINT jobs_urgency_check CHECK (((urgency)::text = ANY ((ARRAY['普通'::character varying, '紧急'::character varying, '非常紧急'::character varying])::text[]))),
    CONSTRAINT jobs_work_mode_check CHECK (((work_mode)::text = ANY ((ARRAY['现场'::character varying, '远程'::character varying, '混合'::character varying])::text[])))
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: COLUMN jobs.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.id IS '职位ID，自增主键';


--
-- Name: COLUMN jobs.company_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.company_id IS '关联公司ID，级联删除';


--
-- Name: COLUMN jobs.recruiter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.recruiter_id IS '关联招聘方ID，级联删除';


--
-- Name: COLUMN jobs.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.title IS '职位名称';


--
-- Name: COLUMN jobs.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.description IS '职位描述';


--
-- Name: COLUMN jobs.salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.salary IS '薪资范围';


--
-- Name: COLUMN jobs.location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.location IS '工作地点';


--
-- Name: COLUMN jobs.experience; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.experience IS '工作经验要求';


--
-- Name: COLUMN jobs.degree; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.degree IS '学历要求';


--
-- Name: COLUMN jobs.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.type IS '工作类型：全职、兼职、实习';


--
-- Name: COLUMN jobs.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.status IS '职位状态：活跃、已关闭';


--
-- Name: COLUMN jobs.department; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.department IS '所属部门';


--
-- Name: COLUMN jobs.work_mode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.work_mode IS '工作模式';


--
-- Name: COLUMN jobs.job_level; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.job_level IS '职位级别';


--
-- Name: COLUMN jobs.hiring_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.hiring_count IS '招聘人数';


--
-- Name: COLUMN jobs.urgency; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.urgency IS '招聘紧急程度';


--
-- Name: COLUMN jobs.required_skills; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.required_skills IS '必备技能，JSON数组';


--
-- Name: COLUMN jobs.preferred_skills; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.preferred_skills IS '加分技能，JSON数组';


--
-- Name: COLUMN jobs.benefits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.benefits IS '福利待遇，JSON数组';


--
-- Name: COLUMN jobs.publish_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.publish_date IS '发布日期';


--
-- Name: COLUMN jobs.expire_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.expire_date IS '过期日期';


--
-- Name: COLUMN jobs.views_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.views_count IS '浏览次数';


--
-- Name: COLUMN jobs.applications_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.applications_count IS '申请人数';


--
-- Name: COLUMN jobs.match_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.match_rate IS '匹配率';


--
-- Name: COLUMN jobs.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.created_at IS '创建时间';


--
-- Name: COLUMN jobs.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.jobs.updated_at IS '更新时间';


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    text text NOT NULL,
    type character varying(20) DEFAULT 'text'::character varying,
    status character varying(20) DEFAULT 'sent'::character varying,
    "time" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    file_url character varying(255),
    file_name character varying(100),
    file_size integer,
    file_type character varying(50),
    link_title character varying(100),
    link_description text,
    link_thumbnail character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    is_deleted boolean DEFAULT false,
    deleted_by integer,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'read'::character varying])::text[]))),
    CONSTRAINT messages_type_check CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'system'::character varying, 'file'::character varying, 'link'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: COLUMN messages.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.id IS '消息ID，自增主键';


--
-- Name: COLUMN messages.conversation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.conversation_id IS '关联对话ID，级联删除';


--
-- Name: COLUMN messages.sender_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.sender_id IS '发送者ID，关联用户ID';


--
-- Name: COLUMN messages.receiver_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.receiver_id IS '接收者ID，关联用户ID';


--
-- Name: COLUMN messages.text; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.text IS '消息内容';


--
-- Name: COLUMN messages.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.type IS '消息类型：文本、图片、系统消息、文件、链接';


--
-- Name: COLUMN messages.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.status IS '消息状态：已发送、已送达、已读';


--
-- Name: COLUMN messages."time"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages."time" IS '发送时间';


--
-- Name: COLUMN messages.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.created_at IS '创建时间';


--
-- Name: COLUMN messages.file_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.file_url IS '文件URL（如果是文件类型）';


--
-- Name: COLUMN messages.file_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.file_name IS '文件名（如果是文件类型）';


--
-- Name: COLUMN messages.file_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.file_size IS '文件大小（字节）';


--
-- Name: COLUMN messages.file_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.file_type IS '文件类型';


--
-- Name: COLUMN messages.link_title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.link_title IS '链接标题（如果是链接类型）';


--
-- Name: COLUMN messages.link_description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.link_description IS '链接描述（如果是链接类型）';


--
-- Name: COLUMN messages.link_thumbnail; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.link_thumbnail IS '链接缩略图（如果是链接类型）';


--
-- Name: COLUMN messages.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.metadata IS '消息元数据，JSON格式';


--
-- Name: COLUMN messages.is_deleted; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.is_deleted IS '消息是否已删除';


--
-- Name: COLUMN messages.deleted_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.deleted_by IS '删除者ID';


--
-- Name: COLUMN messages.deleted_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.deleted_at IS '删除时间';


--
-- Name: COLUMN messages.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.updated_at IS '更新时间';


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: onboardings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboardings (
    id integer NOT NULL,
    application_id integer NOT NULL,
    onboarding_date date NOT NULL,
    status character varying(20) DEFAULT 'Pending'::character varying,
    notes text,
    onboarding_time time without time zone DEFAULT '09:00:00'::time without time zone,
    onboarding_location character varying(255),
    onboarding_contact character varying(50),
    onboarding_contact_phone character varying(20),
    required_documents jsonb DEFAULT '[]'::jsonb,
    submitted_documents jsonb DEFAULT '[]'::jsonb,
    onboarding_steps jsonb DEFAULT '[]'::jsonb,
    completed_steps jsonb DEFAULT '[]'::jsonb,
    official_salary character varying(20),
    probation_salary character varying(20),
    probation_period integer DEFAULT 3,
    official_benefits jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT onboardings_status_check CHECK (((status)::text = ANY ((ARRAY['Scheduled'::character varying, 'Completed'::character varying, 'Pending'::character varying])::text[])))
);


ALTER TABLE public.onboardings OWNER TO postgres;

--
-- Name: COLUMN onboardings.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.id IS '入职ID，自增主键';


--
-- Name: COLUMN onboardings.application_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.application_id IS '关联申请记录ID，级联删除';


--
-- Name: COLUMN onboardings.onboarding_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_date IS '入职日期';


--
-- Name: COLUMN onboardings.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.status IS '入职状态：已安排、已完成、待安排';


--
-- Name: COLUMN onboardings.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.notes IS '入职备注';


--
-- Name: COLUMN onboardings.onboarding_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_time IS '入职时间';


--
-- Name: COLUMN onboardings.onboarding_location; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_location IS '入职地点';


--
-- Name: COLUMN onboardings.onboarding_contact; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_contact IS '入职联系人';


--
-- Name: COLUMN onboardings.onboarding_contact_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_contact_phone IS '入职联系人电话';


--
-- Name: COLUMN onboardings.required_documents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.required_documents IS '所需材料，JSON数组';


--
-- Name: COLUMN onboardings.submitted_documents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.submitted_documents IS '已提交材料，JSON数组';


--
-- Name: COLUMN onboardings.onboarding_steps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.onboarding_steps IS '入职流程，JSON数组';


--
-- Name: COLUMN onboardings.completed_steps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.completed_steps IS '已完成流程，JSON数组';


--
-- Name: COLUMN onboardings.official_salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.official_salary IS '正式薪资';


--
-- Name: COLUMN onboardings.probation_salary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.probation_salary IS '试用期薪资';


--
-- Name: COLUMN onboardings.probation_period; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.probation_period IS '试用期（月）';


--
-- Name: COLUMN onboardings.official_benefits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.official_benefits IS '正式福利，JSON数组';


--
-- Name: COLUMN onboardings.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.created_at IS '创建时间';


--
-- Name: COLUMN onboardings.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.onboardings.updated_at IS '更新时间';


--
-- Name: onboardings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboardings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboardings_id_seq OWNER TO postgres;

--
-- Name: onboardings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboardings_id_seq OWNED BY public.onboardings.id;


--
-- Name: recruiter_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruiter_user (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company_id integer NOT NULL,
    is_verified boolean DEFAULT false,
    business_license character varying(255),
    contact_info character varying(255),
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    verification_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recruiter_user_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.recruiter_user OWNER TO postgres;

--
-- Name: TABLE recruiter_user; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recruiter_user IS '招聘者验证表，存储招聘者的企业认证信息';


--
-- Name: COLUMN recruiter_user.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.id IS '主键，自增ID';


--
-- Name: COLUMN recruiter_user.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.user_id IS '用户ID，关联users表';


--
-- Name: COLUMN recruiter_user.company_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.company_id IS '企业ID，关联companies表';


--
-- Name: COLUMN recruiter_user.is_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.is_verified IS '是否已验证';


--
-- Name: COLUMN recruiter_user.business_license; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.business_license IS '营业执照照片路径';


--
-- Name: COLUMN recruiter_user.contact_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.contact_info IS '联系人信息';


--
-- Name: COLUMN recruiter_user.verification_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.verification_status IS '验证状态：pending（待审核）、approved（已通过）、rejected（已拒绝）';


--
-- Name: COLUMN recruiter_user.verification_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.verification_date IS '验证日期';


--
-- Name: COLUMN recruiter_user.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.created_at IS '创建时间';


--
-- Name: COLUMN recruiter_user.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiter_user.updated_at IS '更新时间';


--
-- Name: recruiter_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruiter_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruiter_user_id_seq OWNER TO postgres;

--
-- Name: recruiter_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruiter_user_id_seq OWNED BY public.recruiter_user.id;


--
-- Name: recruiters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruiters (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company_id integer NOT NULL,
    "position" character varying(50),
    department character varying(50),
    responsibility character varying(255),
    is_verified boolean DEFAULT false,
    verification_date timestamp with time zone,
    posted_jobs_count integer DEFAULT 0,
    reviewed_applications_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.recruiters OWNER TO postgres;

--
-- Name: COLUMN recruiters.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.id IS '招聘方ID，自增主键';


--
-- Name: COLUMN recruiters.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.user_id IS '关联用户ID，级联删除';


--
-- Name: COLUMN recruiters.company_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.company_id IS '关联公司ID，级联删除';


--
-- Name: COLUMN recruiters."position"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters."position" IS '职位';


--
-- Name: COLUMN recruiters.department; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.department IS '所属部门';


--
-- Name: COLUMN recruiters.responsibility; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.responsibility IS '职责描述';


--
-- Name: COLUMN recruiters.is_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.is_verified IS '认证状态';


--
-- Name: COLUMN recruiters.verification_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.verification_date IS '认证时间';


--
-- Name: COLUMN recruiters.posted_jobs_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.posted_jobs_count IS '发布职位数量';


--
-- Name: COLUMN recruiters.reviewed_applications_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.reviewed_applications_count IS '审核申请数量';


--
-- Name: COLUMN recruiters.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.created_at IS '创建时间';


--
-- Name: COLUMN recruiters.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recruiters.updated_at IS '更新时间';


--
-- Name: recruiters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruiters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruiters_id_seq OWNER TO postgres;

--
-- Name: recruiters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruiters_id_seq OWNED BY public.recruiters.id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resumes (
    id integer NOT NULL,
    candidate_id integer NOT NULL,
    resume_title character varying(100),
    is_default boolean DEFAULT false,
    education jsonb DEFAULT '[]'::jsonb,
    work_experience jsonb DEFAULT '[]'::jsonb,
    projects jsonb DEFAULT '[]'::jsonb,
    skills jsonb DEFAULT '[]'::jsonb,
    certifications jsonb DEFAULT '[]'::jsonb,
    languages jsonb DEFAULT '[]'::jsonb,
    self_evaluation text,
    awards jsonb DEFAULT '[]'::jsonb,
    trainings jsonb DEFAULT '[]'::jsonb,
    patents jsonb DEFAULT '[]'::jsonb,
    papers jsonb DEFAULT '[]'::jsonb,
    portfolio_links jsonb DEFAULT '[]'::jsonb,
    view_count integer DEFAULT 0,
    download_count integer DEFAULT 0,
    resume_file_url character varying(255),
    resume_file_name character varying(100),
    resume_file_size integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    file_type character varying(20),
    upload_ip character varying(50),
    upload_time timestamp without time zone,
    is_public boolean DEFAULT false
);


ALTER TABLE public.resumes OWNER TO postgres;

--
-- Name: COLUMN resumes.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.id IS '简历ID，自增主键';


--
-- Name: COLUMN resumes.candidate_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.candidate_id IS '关联求职者ID，级联删除';


--
-- Name: COLUMN resumes.resume_title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.resume_title IS '简历标题';


--
-- Name: COLUMN resumes.is_default; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.is_default IS '是否为默认简历';


--
-- Name: COLUMN resumes.education; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.education IS '教育经历，JSON数组';


--
-- Name: COLUMN resumes.work_experience; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.work_experience IS '工作经历，JSON数组';


--
-- Name: COLUMN resumes.projects; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.projects IS '项目经历，JSON数组';


--
-- Name: COLUMN resumes.skills; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.skills IS '技能标签，JSON数组';


--
-- Name: COLUMN resumes.certifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.certifications IS '证书，JSON数组';


--
-- Name: COLUMN resumes.languages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.languages IS '语言能力，JSON数组';


--
-- Name: COLUMN resumes.self_evaluation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.self_evaluation IS '自我评价';


--
-- Name: COLUMN resumes.awards; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.awards IS '获奖情况，JSON数组';


--
-- Name: COLUMN resumes.trainings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.trainings IS '培训经历，JSON数组';


--
-- Name: COLUMN resumes.patents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.patents IS '专利情况，JSON数组';


--
-- Name: COLUMN resumes.papers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.papers IS '论文情况，JSON数组';


--
-- Name: COLUMN resumes.portfolio_links; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.portfolio_links IS '作品集链接，JSON数组';


--
-- Name: COLUMN resumes.view_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.view_count IS '被查看次数';


--
-- Name: COLUMN resumes.download_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.download_count IS '被下载次数';


--
-- Name: COLUMN resumes.resume_file_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.resume_file_url IS '简历文件URL';


--
-- Name: COLUMN resumes.resume_file_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.resume_file_name IS '简历文件名';


--
-- Name: COLUMN resumes.resume_file_size; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.resume_file_size IS '简历文件大小（字节）';


--
-- Name: COLUMN resumes.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.created_at IS '创建时间';


--
-- Name: COLUMN resumes.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resumes.updated_at IS '更新时间';


--
-- Name: resumes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resumes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resumes_id_seq OWNER TO postgres;

--
-- Name: resumes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resumes_id_seq OWNED BY public.resumes.id;


--
-- Name: saved_companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_companies (
    id integer NOT NULL,
    user_id integer NOT NULL,
    company_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.saved_companies OWNER TO postgres;

--
-- Name: saved_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_companies_id_seq OWNER TO postgres;

--
-- Name: saved_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_companies_id_seq OWNED BY public.saved_companies.id;


--
-- Name: saved_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_jobs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    job_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.saved_jobs OWNER TO postgres;

--
-- Name: saved_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_jobs_id_seq OWNER TO postgres;

--
-- Name: saved_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_jobs_id_seq OWNED BY public.saved_jobs.id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    description text,
    ip_address character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    log_type character varying(50),
    resource_type character varying(50),
    resource_id integer,
    request_method character varying(10),
    request_url character varying(255),
    request_params jsonb DEFAULT '{}'::jsonb,
    response_status integer,
    response_time integer,
    error_code character varying(50),
    error_message text,
    stack_trace text,
    user_agent text,
    device_type character varying(20),
    browser character varying(50),
    os character varying(50),
    country character varying(50),
    region character varying(50),
    city character varying(50),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT system_logs_device_type_check CHECK (((device_type)::text = ANY ((ARRAY['desktop'::character varying, 'mobile'::character varying, 'tablet'::character varying])::text[]))),
    CONSTRAINT system_logs_log_type_check CHECK (((log_type)::text = ANY ((ARRAY['login'::character varying, 'logout'::character varying, 'create'::character varying, 'update'::character varying, 'delete'::character varying, 'error'::character varying, 'warning'::character varying, 'info'::character varying])::text[])))
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: COLUMN system_logs.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.id IS '日志ID，自增主键';


--
-- Name: COLUMN system_logs.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.user_id IS '操作用户ID，关联用户ID，删除时设为NULL';


--
-- Name: COLUMN system_logs.action; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.action IS '操作类型';


--
-- Name: COLUMN system_logs.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.description IS '操作描述';


--
-- Name: COLUMN system_logs.ip_address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.ip_address IS '操作IP地址';


--
-- Name: COLUMN system_logs.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.created_at IS '创建时间';


--
-- Name: COLUMN system_logs.log_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.log_type IS '日志类型';


--
-- Name: COLUMN system_logs.resource_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.resource_type IS '操作资源类型';


--
-- Name: COLUMN system_logs.resource_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.resource_id IS '操作资源ID';


--
-- Name: COLUMN system_logs.request_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.request_method IS '请求方法';


--
-- Name: COLUMN system_logs.request_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.request_url IS '请求URL';


--
-- Name: COLUMN system_logs.request_params; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.request_params IS '请求参数，JSON格式';


--
-- Name: COLUMN system_logs.response_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.response_status IS '响应状态码';


--
-- Name: COLUMN system_logs.response_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.response_time IS '响应时间（毫秒）';


--
-- Name: COLUMN system_logs.error_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.error_code IS '错误代码';


--
-- Name: COLUMN system_logs.error_message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.error_message IS '错误信息';


--
-- Name: COLUMN system_logs.stack_trace; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.stack_trace IS '堆栈跟踪';


--
-- Name: COLUMN system_logs.user_agent; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.user_agent IS '用户代理信息';


--
-- Name: COLUMN system_logs.device_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.device_type IS '设备类型';


--
-- Name: COLUMN system_logs.browser; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.browser IS '浏览器';


--
-- Name: COLUMN system_logs.os; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.os IS '操作系统';


--
-- Name: COLUMN system_logs.country; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.country IS '国家';


--
-- Name: COLUMN system_logs.region; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.region IS '地区';


--
-- Name: COLUMN system_logs.city; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.city IS '城市';


--
-- Name: COLUMN system_logs.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.system_logs.updated_at IS '更新时间';


--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO postgres;

--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'recruiter'::character varying, 'candidate'::character varying])::text[])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_roles IS '用户角色关联表，实现用户与角色的多对多关系';


--
-- Name: COLUMN user_roles.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_roles.id IS '关联ID，自增主键';


--
-- Name: COLUMN user_roles.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_roles.user_id IS '用户ID，关联users表';


--
-- Name: COLUMN user_roles.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_roles.role IS '角色类型：admin、recruiter、candidate';


--
-- Name: COLUMN user_roles.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_roles.created_at IS '创建时间';


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(20),
    avatar character varying(255),
    gender character varying(10),
    birth_date date,
    education character varying(20),
    major character varying(50),
    school character varying(100),
    graduation_year character varying(10),
    work_experience_years integer DEFAULT 0,
    desired_position character varying(100),
    skills jsonb DEFAULT '[]'::jsonb,
    languages jsonb DEFAULT '[]'::jsonb,
    emergency_contact character varying(50),
    emergency_phone character varying(20),
    address character varying(255),
    wechat character varying(50),
    linkedin character varying(100),
    github character varying(100),
    personal_website character varying(255),
    id_card character varying(18),
    nationality character varying(20),
    political_status character varying(20),
    marital_status character varying(10),
    status character varying(20) DEFAULT 'active'::character varying,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    resume_completeness integer DEFAULT 0,
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    registration_ip character varying(45),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "position" character varying(255),
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['男'::character varying, '女'::character varying, '其他'::character varying])::text[]))),
    CONSTRAINT users_marital_status_check CHECK (((marital_status)::text = ANY ((ARRAY['未婚'::character varying, '已婚'::character varying, '离异'::character varying, '丧偶'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'banned'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.id IS '用户ID，自增主键';


--
-- Name: COLUMN users.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.name IS '用户名';


--
-- Name: COLUMN users.email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.email IS '邮箱，唯一约束';


--
-- Name: COLUMN users.password; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password IS '密码，加密存储';


--
-- Name: COLUMN users.phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.phone IS '手机号';


--
-- Name: COLUMN users.avatar; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.avatar IS '头像URL';


--
-- Name: COLUMN users.gender; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.gender IS '性别';


--
-- Name: COLUMN users.birth_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.birth_date IS '出生日期';


--
-- Name: COLUMN users.education; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.education IS '最高学历';


--
-- Name: COLUMN users.major; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.major IS '专业';


--
-- Name: COLUMN users.school; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.school IS '毕业院校';


--
-- Name: COLUMN users.graduation_year; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.graduation_year IS '毕业年份';


--
-- Name: COLUMN users.work_experience_years; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.work_experience_years IS '工作经验年限';


--
-- Name: COLUMN users.desired_position; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.desired_position IS '期望职位';


--
-- Name: COLUMN users.skills; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.skills IS '技能标签，JSON数组';


--
-- Name: COLUMN users.languages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.languages IS '语言能力，JSON数组';


--
-- Name: COLUMN users.emergency_contact; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.emergency_contact IS '紧急联系人';


--
-- Name: COLUMN users.emergency_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.emergency_phone IS '紧急联系人电话';


--
-- Name: COLUMN users.address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.address IS '详细地址';


--
-- Name: COLUMN users.wechat; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.wechat IS '微信号';


--
-- Name: COLUMN users.linkedin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.linkedin IS 'LinkedIn账号';


--
-- Name: COLUMN users.github; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.github IS 'GitHub账号';


--
-- Name: COLUMN users.personal_website; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.personal_website IS '个人网站';


--
-- Name: COLUMN users.id_card; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.id_card IS '身份证号';


--
-- Name: COLUMN users.nationality; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.nationality IS '民族';


--
-- Name: COLUMN users.political_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.political_status IS '政治面貌';


--
-- Name: COLUMN users.marital_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.marital_status IS '婚姻状况';


--
-- Name: COLUMN users.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.status IS '账号状态';


--
-- Name: COLUMN users.email_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.email_verified IS '邮箱验证状态';


--
-- Name: COLUMN users.phone_verified; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.phone_verified IS '手机验证状态';


--
-- Name: COLUMN users.resume_completeness; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.resume_completeness IS '简历完整度，0-100';


--
-- Name: COLUMN users.last_login_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_login_at IS '最后登录时间';


--
-- Name: COLUMN users.last_login_ip; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_login_ip IS '最后登录IP';


--
-- Name: COLUMN users.registration_ip; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.registration_ip IS '注册IP';


--
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.created_at IS '创建时间';


--
-- Name: COLUMN users.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.updated_at IS '更新时间';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ai_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_sessions ALTER COLUMN id SET DEFAULT nextval('public.ai_sessions_id_seq'::regclass);


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: candidate_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_user ALTER COLUMN id SET DEFAULT nextval('public.candidate_user_id_seq'::regclass);


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: interviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews ALTER COLUMN id SET DEFAULT nextval('public.interviews_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: onboardings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboardings ALTER COLUMN id SET DEFAULT nextval('public.onboardings_id_seq'::regclass);


--
-- Name: recruiter_user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_user ALTER COLUMN id SET DEFAULT nextval('public.recruiter_user_id_seq'::regclass);


--
-- Name: recruiters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters ALTER COLUMN id SET DEFAULT nextval('public.recruiters_id_seq'::regclass);


--
-- Name: resumes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes ALTER COLUMN id SET DEFAULT nextval('public.resumes_id_seq'::regclass);


--
-- Name: saved_companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_companies ALTER COLUMN id SET DEFAULT nextval('public.saved_companies_id_seq'::regclass);


--
-- Name: saved_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs ALTER COLUMN id SET DEFAULT nextval('public.saved_jobs_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: ai_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_sessions (id, user_id, title, messages, created_at, updated_at, session_type, is_active, total_messages, metadata, last_message_at, session_duration, ai_model, ai_prompt_template, status, rating, feedback, tags, attached_resources) FROM stdin;
6	2	新对话	[{"role": "ai", "text": "你好，艾希！我是您的AI求职助手。"}, {"role": "user", "text": "艾希！我是您的AI求职助手1111"}, {"role": "ai", "text": "你好，艾希！很高兴为你提供求职支持。根据你的背景和需求，我将为你推荐合适的岗位，并提供专业的求职建议。你目前有特别关注的行业或岗位方向吗？"}]	2025-12-01 13:57:21.546379+08	2025-12-01 13:57:28.882862+08	general	t	3	{}	2025-12-01 13:57:28.881+08	0	\N	\N	active	\N	\N	[]	[]
4	2	新对话	[{"role": "ai", "text": "你好，艾希！我是您的AI求职助手。"}, {"role": "user", "text": "AI求职助手"}, {"role": "ai", "text": "你好，艾希！我是你的AI求职助手，专注于为你推荐符合技能和职业目标的岗位。根据你的核心技能（React、Vue、TypeScript、Node.js、Tailwind CSS）以及所在城市深圳，我可以为你筛选出高匹配度的前端/全栈开发岗位。\\n\\n你目前的状态是在职-考虑机会，期望薪资为20K-30K。是否需要我为你推荐一些合适的岗位？或者你有其他具体的职业发展需求？"}]	2025-12-01 13:52:13.561737+08	2025-12-01 13:57:39.440524+08	general	t	3	{}	2025-12-01 13:57:39.274+08	0	\N	\N	active	\N	\N	[]	[]
7	2	新对话	[{"role": "ai", "text": "你好，艾希！我是您的AI求职助手。"}, {"role": "user", "text": "时间"}, {"role": "ai", "text": "您提到“时间”，请问您具体是指什么方面的时间？例如：\\n\\n- 想了解面试流程的时间安排？\\n- 希望了解岗位招聘的截止时间？\\n- 还是其他与时间相关的问题？\\n\\n请进一步说明，我会为您提供更精准的帮助。"}]	2025-12-01 13:57:39.44013+08	2025-12-01 13:57:52.867111+08	general	t	3	{}	2025-12-01 13:57:52.865+08	0	\N	\N	active	\N	\N	[]	[]
18	20	有什么推荐的吗	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "有什么推荐的吗"}, {"role": "ai", "text": "您好，于吉。为了给您更精准的岗位推荐，我需要了解一些信息：您所在的城市、期望薪资范围、当前的工作状态（如是否在职），以及您的核心技能或专业背景。请您补充这些信息，我将为您推荐合适的岗位。"}]	2025-12-02 10:15:27.800987+08	2025-12-02 10:15:45.422929+08	general	t	3	{}	2025-12-02 10:15:45.422+08	0	\N	\N	active	\N	\N	[]	[]
19	20	你认为这个项目有什么需要优化的地方	[{"role": "ai", "content": "你好，！我是您的AI求职助手。"}, {"role": "user", "text": "你认为这个项目有什么需要优化的地方"}, {"role": "ai", "text": "请提供项目的具体信息或背景，例如项目类型、目标、当前遇到的问题等，这样我可以更准确地分析并提出优化建议。"}, {"role": "user", "text": "提供项目的具体信息或背景，例如项目类型、目标、当前遇到的问题等，这样你可以更准确地分析并提出优化建议。"}, {"role": "ai", "text": "您提到的项目信息目前尚不明确。为了更好地为您提供优化建议或相关岗位推荐，请补充以下内容：\\n\\n1. **项目类型**（如：软件开发、数据分析、市场营销、产品设计等）  \\n2. **项目目标**（如：提升用户体验、提高转化率、优化流程等）  \\n3. **当前遇到的问题**（如：技术瓶颈、资源不足、进度延迟等）  \\n\\n如果您能提供这些信息，我将为您进行更精准的分析与建议。"}]	2025-12-02 13:00:04.574384+08	2025-12-02 14:48:11.67492+08	general	t	5	{}	2025-12-02 14:48:11.673+08	0	\N	\N	active	\N	\N	[]	[]
16	20	现在是几点了	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "现在是几点了"}, {"role": "ai", "text": "现在是凌晨1:23。不过，如果您有关于求职或岗位推荐的问题，我很乐意为您提供帮助。您需要了解哪些信息呢？"}]	2025-12-02 10:15:08.6346+08	2025-12-02 10:15:15.33343+08	general	t	3	{}	2025-12-02 10:15:15.332+08	0	\N	\N	active	\N	\N	[]	[]
55	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 17:02:22.757492+08	2025-12-20 17:02:22.757492+08	general	t	1	{}	2025-12-20 17:02:22.612+08	0	\N	\N	active	\N	\N	[]	[]
41	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:52:53.927817+08	2025-12-20 16:52:53.927817+08	general	t	1	{}	2025-12-20 16:52:53.927+08	0	\N	\N	active	\N	\N	[]	[]
42	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:52:53.960981+08	2025-12-20 16:52:53.960981+08	general	t	1	{}	2025-12-20 16:52:53.96+08	0	\N	\N	active	\N	\N	[]	[]
20	20	提供项目的具体信息或背景	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "提供项目的具体信息或背景，例如项目类型、目标、当前遇到的问题等，这样我可以更准确地分析并提出优化建议。"}, {"role": "ai", "text": "您提到的项目信息目前尚不明确。为了更好地为您提供优化建议或岗位推荐，请补充以下信息：\\n\\n1. **项目类型**（如：软件开发、数据分析、产品设计、市场推广等）  \\n2. **项目目标**（如：提升用户体验、提高转化率、优化流程等）  \\n3. **当前遇到的问题**（如：技术瓶颈、资源不足、进度延迟等）\\n\\n若您能提供更多细节，我将为您进行更精准的分析与建议。"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "您好，于吉。为了更好地为您提供求职建议和岗位推荐，请您补充以下信息：\\n\\n1. **所在城市**：您希望在哪个城市找工作？\\n2. **期望薪资**：您对薪资的期望范围是多少？\\n3. **状态**：您目前是处于在职、离职还是应届生状态？\\n4. **核心技能**：您具备哪些专业技能或工作经验？\\n\\n请您提供以上信息，我将为您进行更精准的分析与推荐。"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "您好，于吉。为了更好地为您推荐合适的岗位和提供求职建议，请您补充以下信息：\\n\\n1. **所在城市**：您目前所在的城市或希望工作的城市？\\n2. **期望薪资**：您期望的月薪范围？\\n3. **状态**：您目前是处于在职、离职、还是求职中？\\n4. **核心技能**：您具备哪些专业技能或工作经验？（例如：数据分析、项目管理、编程语言等）\\n\\n请您补充以上信息，我将为您进行更精准的岗位推荐和职业规划建议。"}]	2025-12-02 14:48:33.941878+08	2025-12-12 14:31:22.403518+08	general	t	7	{}	2025-12-12 14:31:22.402+08	0	\N	\N	active	\N	\N	[]	[]
24	20	你可以写程序吗	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "你可以写程序吗"}, {"role": "ai", "text": "我可以协助编写程序，但需要您提供具体需求、编程语言及功能描述。请说明您需要实现什么功能或解决什么问题，我将为您提供相应的代码示例或建议。"}]	2025-12-18 15:25:43.471875+08	2025-12-18 15:25:56.338631+08	general	t	3	{}	2025-12-18 15:25:56.337+08	0	\N	\N	active	\N	\N	[]	[]
25	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:36.128873+08	2025-12-20 16:50:36.128873+08	general	t	1	{}	2025-12-20 16:50:36.127+08	0	\N	\N	active	\N	\N	[]	[]
26	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:36.127212+08	2025-12-20 16:50:36.127212+08	general	t	1	{}	2025-12-20 16:50:36.125+08	0	\N	\N	active	\N	\N	[]	[]
27	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:38.531139+08	2025-12-20 16:50:38.531139+08	general	t	1	{}	2025-12-20 16:50:38.529+08	0	\N	\N	active	\N	\N	[]	[]
28	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:39.7995+08	2025-12-20 16:50:39.7995+08	general	t	1	{}	2025-12-20 16:50:39.798+08	0	\N	\N	active	\N	\N	[]	[]
29	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:46.101476+08	2025-12-20 16:50:46.101476+08	general	t	1	{}	2025-12-20 16:50:46.1+08	0	\N	\N	active	\N	\N	[]	[]
30	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:46.105704+08	2025-12-20 16:50:46.105704+08	general	t	1	{}	2025-12-20 16:50:46.104+08	0	\N	\N	active	\N	\N	[]	[]
31	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:48.507008+08	2025-12-20 16:50:48.507008+08	general	t	1	{}	2025-12-20 16:50:48.505+08	0	\N	\N	active	\N	\N	[]	[]
32	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:48.508531+08	2025-12-20 16:50:48.508531+08	general	t	1	{}	2025-12-20 16:50:48.507+08	0	\N	\N	active	\N	\N	[]	[]
33	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:49.127027+08	2025-12-20 16:50:49.127027+08	general	t	1	{}	2025-12-20 16:50:49.125+08	0	\N	\N	active	\N	\N	[]	[]
34	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:49.756732+08	2025-12-20 16:50:49.756732+08	general	t	1	{}	2025-12-20 16:50:49.755+08	0	\N	\N	active	\N	\N	[]	[]
35	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:49.97422+08	2025-12-20 16:50:49.97422+08	general	t	1	{}	2025-12-20 16:50:49.973+08	0	\N	\N	active	\N	\N	[]	[]
36	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:50.159125+08	2025-12-20 16:50:50.159125+08	general	t	1	{}	2025-12-20 16:50:50.157+08	0	\N	\N	active	\N	\N	[]	[]
37	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:50.313795+08	2025-12-20 16:50:50.313795+08	general	t	1	{}	2025-12-20 16:50:50.312+08	0	\N	\N	active	\N	\N	[]	[]
38	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:55.506551+08	2025-12-20 16:50:55.506551+08	general	t	1	{}	2025-12-20 16:50:55.505+08	0	\N	\N	active	\N	\N	[]	[]
39	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:56.144218+08	2025-12-20 16:50:56.144218+08	general	t	1	{}	2025-12-20 16:50:56.143+08	0	\N	\N	active	\N	\N	[]	[]
40	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:50:57.119347+08	2025-12-20 16:50:57.119347+08	general	t	1	{}	2025-12-20 16:50:57.118+08	0	\N	\N	active	\N	\N	[]	[]
46	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:57:27.86962+08	2025-12-20 16:57:27.86962+08	general	t	1	{}	2025-12-20 16:57:27.869+08	0	\N	\N	active	\N	\N	[]	[]
47	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:57:28.054395+08	2025-12-20 16:57:28.054395+08	general	t	1	{}	2025-12-20 16:57:28.053+08	0	\N	\N	active	\N	\N	[]	[]
48	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:57:28.24276+08	2025-12-20 16:57:28.24276+08	general	t	1	{}	2025-12-20 16:57:28.242+08	0	\N	\N	active	\N	\N	[]	[]
49	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:57:28.413701+08	2025-12-20 16:57:28.413701+08	general	t	1	{}	2025-12-20 16:57:28.412+08	0	\N	\N	active	\N	\N	[]	[]
51	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:58:09.246047+08	2025-12-20 16:58:09.246047+08	general	t	1	{}	2025-12-20 16:58:09.245+08	0	\N	\N	active	\N	\N	[]	[]
50	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:58:09.244793+08	2025-12-20 16:58:09.244793+08	general	t	1	{}	2025-12-20 16:58:09.244+08	0	\N	\N	active	\N	\N	[]	[]
52	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:58:15.386304+08	2025-12-20 16:58:15.386304+08	general	t	1	{}	2025-12-20 16:58:15.385+08	0	\N	\N	active	\N	\N	[]	[]
53	20	新对话	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}]	2025-12-20 16:59:59.686729+08	2025-12-20 16:59:59.686729+08	general	t	1	{}	2025-12-20 16:59:59.685+08	0	\N	\N	active	\N	\N	[]	[]
57	20	2	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "您好，于吉。为了更好地为您提供求职建议和岗位推荐，请您补充以下信息：\\n\\n1. 您目前所在的城市是哪里？\\n2. 您期望的薪资范围是多少？\\n3. 您目前的求职状态（如：在职、离职、在校）？\\n4. 您的核心技能或专业方向是什么？\\n\\n期待您的回复，以便我为您精准推荐合适的岗位。"}, {"role": "user", "text": "5"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "1+2"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "您好，于吉。为了更好地为您提供求职建议和岗位推荐，请您补充以下信息：\\n\\n1. **所在城市**：您目前所在的地区或期望工作的城市？\\n2. **期望薪资**：您希望获得的月薪范围？\\n3. **状态**：您目前是处于在职状态、离职状态还是应届毕业生？\\n4. **核心技能**：您具备哪些专业技能或工作经验？\\n\\n请您提供以上信息，我将为您推荐合适的岗位并提供专业的求职建议。"}]	2025-12-20 17:53:26.585358+08	2025-12-22 10:23:15.090608+08	general	t	13	{}	2025-12-22 10:23:15.09+08	0	\N	\N	active	\N	\N	[]	[]
56	20	1	[{"role": "ai", "content": "你好，于吉！我是您的AI求职助手。"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "AI服务配置错误，请检查API密钥。请在项目根目录的 .env 文件中设置 QIANWEN_API_KEY 或 VITE_QIANWEN_API_KEY。"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务配置错误，请检查API密钥。请在项目根目录的 .env 文件中设置 QIANWEN_API_KEY 或 VITE_QIANWEN_API_KEY。"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求失败 (500): Internal Server Error"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "2"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "3"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}, {"role": "user", "text": "1"}, {"role": "ai", "text": "AI服务请求异常: Failed to fetch"}]	2025-12-20 17:02:23.824446+08	2025-12-20 21:53:21.166089+08	general	t	29	{}	2025-12-20 21:53:21.165+08	0	\N	\N	active	\N	\N	[]	[]
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, candidate_id, job_id, status, match_score, applied_date, resume_id, cover_letter, match_details, status_history, interview_count, offer_salary, offer_benefits, rejection_reason, rejection_type, last_activity_at, created_at, updated_at) FROM stdin;
6	1	1	Screening	0	2025-12-18 20:27:10.600801+08	\N	\N	{}	[]	0	\N	[]	\N	\N	2025-12-18 20:27:10.600801+08	2025-12-16 20:27:10.600801+08	2025-12-16 20:27:10.600801+08
7	2	2	Interview	0	2025-12-18 20:27:10.600801+08	\N	\N	{}	[]	0	\N	[]	\N	\N	2025-12-18 20:27:10.600801+08	2025-12-17 20:27:10.600801+08	2025-12-17 20:27:10.600801+08
8	3	3	Offer	0	2025-12-18 20:27:10.600801+08	\N	\N	{}	[]	0	\N	[]	\N	\N	2025-12-18 20:27:10.600801+08	2025-12-15 20:27:10.600801+08	2025-12-15 20:27:10.600801+08
9	19	6	New	0	2025-12-18 20:27:10.600801+08	\N	\N	{}	[]	0	\N	[]	\N	\N	2025-12-18 20:27:10.600801+08	2025-12-14 20:27:10.600801+08	2025-12-14 20:27:10.600801+08
\.


--
-- Data for Name: candidate_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidate_user (id, user_id, is_verified, created_at, updated_at) FROM stdin;
1	18	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
2	8	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
3	9	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
4	10	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
5	2	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
6	11	t	2025-11-27 23:30:48.34902	2025-11-27 23:30:48.34902
7	19	t	2025-11-27 23:35:13.903204	2025-11-27 23:35:13.903204
8	20	t	2025-11-27 23:35:13.964842	2025-11-27 23:35:13.964842
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates (id, user_id, experience, city, expected_salary, job_status, bio, job_type_preference, work_mode_preference, industry_preference, location_preference, current_salary, salary_negotiable, notice_period, can_start_date, career_goal, applied_jobs_count, viewed_jobs_count, matched_jobs_count, created_at, updated_at, summary, expected_salary_min, expected_salary_max, availability_status, preferred_locations) FROM stdin;
1	8	3-5年	北京	20-30K	active	资深前端工程师，熟悉React和TypeScript	["全职"]	["混合", "远程"]	["互联网", "科技"]	["北京", "上海"]	\N	f	\N	\N	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08	\N	\N	\N	available	\N
2	9	1-3年	上海	15-25K	active	金融专业毕业生，熟悉数据分析	["全职"]	["现场", "混合"]	["金融", "咨询"]	["上海", "杭州"]	\N	f	\N	\N	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08	\N	\N	\N	available	\N
3	10	5-10年	广州	25-40K	active	有丰富的电商运营经验	["全职"]	["现场"]	["电商", "零售"]	["广州", "深圳"]	\N	f	\N	\N	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08	\N	\N	\N	available	\N
19	20		南宁		\N		{}	{}	{}	{}	\N	f	\N	\N	\N	0	0	0	2025-12-12 16:31:06.579253+08	2025-12-19 15:57:59.344511+08	aaaaaaaaaaaaa	1000	25555	available	南宁
20	1	\N	\N	\N	\N	\N	[]	[]	[]	[]	\N	f	\N	\N	\N	0	0	0	2025-12-19 16:28:44.563105+08	2025-12-19 16:28:44.563105+08	\N	\N	\N	available	\N
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, industry, size, address, description, logo, company_type, establishment_date, registered_capital, social_credit_code, company_website, company_phone, company_email, is_verified, verification_date, status, job_count, follower_count, created_at, updated_at, business_license, contact_info) FROM stdin;
4	电子商务有限公司	电商	1000-5000人	广州市天河区珠江新城	领先的电子商务平台	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	2	0	2025-11-27 14:58:45.936806+08	2025-12-19 09:29:35.010351+08	\N	\N
11	默认公司_12	\N	\N	\N	\N	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	f	\N	active	0	0	2025-11-27 23:30:48.368993+08	2025-12-19 09:29:36.12538+08	\N	\N
6	医疗健康有限公司	医疗	200-500人	杭州市西湖区	提供医疗健康解决方案的企业	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	0	0	2025-11-27 14:58:45.936806+08	2025-12-19 09:29:36.629178+08	\N	\N
9	智慧物流有限公司	物流	500-1000人	上海市闵行区虹桥商务区	提供智能化物流解决方案的领先企业	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	2	0	2025-11-27 15:37:41.895102+08	2025-12-19 09:29:37.089896+08	\N	\N
8	绿色能源集团	新能源	1000-5000人	北京市海淀区中关村	致力于清洁能源开发和利用的大型企业集团	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	2	0	2025-11-27 15:37:41.89365+08	2025-12-19 09:29:37.73581+08	\N	\N
10	字节	科技	1000-5000人	\N	\N	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	f	\N	active	0	0	2025-11-27 23:30:48.367666+08	2025-12-19 09:29:38.413272+08	\N	\N
12	科技之星有限公司	互联网	500-1000人	杭州市西湖区	专注于人工智能技术研发和应用的创新型企业	/companies_logo/yuji_yuji_1764584177288.jpg		\N						t	\N	active	0	0	2025-12-01 13:58:01.509191+08	2025-12-19 09:29:42.195168+08		
13	Tech Corp	Technology	Medium	Shanghai	Test company for job posting	/companies_logo/yuji_yuji_1764584177288.jpg	Private	2020-01-01	1000000	1234567890	https://techcorp.example.com	021-12345678	contact@techcorp.example.com	f	\N	active	0	0	2025-12-12 20:15:57.574+08	2025-12-19 09:29:43.430715+08		
3	金融服务集团	金融	500-1000人	上海市浦东新区陆家嘴	提供全方位金融服务的大型集团	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	2	0	2025-11-27 14:58:45.936806+08	2025-12-19 09:29:33.494114+08	\N	\N
5	教育科技有限公司	教育	50-100人	深圳市南山区科技园	专注于在线教育的科技公司	/companies_logo/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	\N	t	\N	active	2	0	2025-11-27 14:58:45.936806+08	2025-12-19 09:29:34.452996+08	\N	\N
7	创新科技有限公司	人工智能	1000人以上	深圳市南山区科技园南区	《创新科技有限公司》是一家专注于人工智能领域的外企，致力于为全球客户提供先进的智能解决方案。公司核心业务涵盖机器学习、自然语言处理及智能数据分析，凭借强大的技术实力和丰富的行业经验，在人工智能领域占据重要地位。我们以技术创新为驱动，持续推动智能化产业升级，助力企业实现数字化转型。面对快速发展的AI市场，公司前景广阔，发展潜力巨大。《创新科技有限公司》拥有专业、开放的工作环境，鼓励员工不断探索与成长，诚邀优秀人才加入，共同开启智能未来。	/companies_logo/yuji_yuji_1764584177288.jpg	外企	2023-01-04	2000	FGDFGD87777777	http://localhost:3000/CHUANGXIN/p	15977846354	zhangsanAAA@tech.com	t	\N	active	2	0	2025-11-27 15:37:41.891269+08	2025-12-19 12:16:25.120452+08	/business_license/创新科技有限公司_营业执照_1766114532213_4664.jpg	lisiwei,188888888
1	科技有限公司	互联网	200-500人	北京市朝阳区科技园	《科技有限公司》是一家专注于互联网领域的外资企业，致力于为全球客户提供创新的数字化解决方案。公司核心业务涵盖软件开发、大数据分析及智能系统集成，凭借领先的技术实力和高效的团队协作，持续推动行业智能化发展。作为快速成长的科技企业，我们深耕互联网行业，紧跟技术趋势，积极拓展国际市场。目前公司规模稳定增长，员工数量在51至200人之间，形成了开放、多元、充满活力的工作氛围。我们重视人才发展，为员工提供广阔的职业平台与成长空间，诚邀志同道合的优秀人才加入，共同开创未来。	/companies_logo/yuji_yuji_1764584177288.jpg	外企	2025-12-12	500	SDFDS4F888S88	http://localhost:3000/recruiter/profile	77846354	65156465@163.COM	t	2020-05-05 10:10:01+08	active	3	0	2025-11-27 13:52:05.661318+08	2025-12-19 11:21:30.599507+08	/business_license/科技有限公司_营业执照_1766114490594_2811.jpg	于吉，13800138002
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, job_id, candidate_id, recruiter_id, last_message, last_time, unread_count, is_active, total_messages, candidate_unread, recruiter_unread, status, created_at, updated_at, deleted_at) FROM stdin;
37	6	19	3	1	2025-12-19 10:39:02.464766+08	0	t	22	0	22	active	2025-12-18 16:17:11.325386+08	2025-12-20 16:53:03.108972+08	\N
38	3	19	1	5	2025-12-19 10:38:36.596084+08	0	t	11	0	11	active	2025-12-18 16:18:30.325044+08	2025-12-20 16:53:08.521645+08	\N
43	23	19	6	收到	2025-12-19 15:16:42.675046+08	0	t	5	0	4	active	2025-12-19 12:07:48.616338+08	2025-12-20 18:07:34.179192+08	\N
36	13	19	6	🆗	2025-12-19 15:16:47.307084+08	0	t	11	0	9	active	2025-12-18 16:09:57.719215+08	2025-12-20 18:07:34.181324+08	\N
31	2	19	1	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	2025-12-18 17:42:04.897+08	0	t	11	0	7	active	2025-12-18 15:26:05.352275+08	2025-12-20 16:53:21.490675+08	\N
44	25	19	6	已向您发送了我的在线简历附件。	2025-12-19 15:37:42.924663+08	0	t	4	0	4	active	2025-12-19 15:37:28.188536+08	2025-12-22 10:22:29.23904+08	\N
39	10	19	5	2	2025-12-20 17:19:58.214793+08	0	t	12	0	12	active	2025-12-18 16:19:24.507184+08	2025-12-22 10:22:31.061+08	\N
41	7	19	3	您好！我是于吉，我想应聘客服主管职位，想了解更多相关信息。	2025-12-18 16:37:55.819+08	0	t	1	0	1	active	2025-12-18 16:37:55.81677+08	2025-12-22 10:22:31.897181+08	\N
40	1	19	1	方便电话沟通吗？	2025-12-19 08:52:58.374+08	0	t	13	0	10	active	2025-12-18 16:37:48.475652+08	2025-12-22 10:22:33.142793+08	\N
45	16	19	9	1	2025-12-20 23:14:52.862449+08	0	t	2	0	2	active	2025-12-20 23:14:26.141955+08	2025-12-22 10:22:38.102691+08	\N
42	9	19	4	您好！我是于吉，我想应聘教学顾问职位，想了解更多相关信息。	2025-12-22 10:22:25.331708+08	0	t	14	0	14	active	2025-12-18 16:38:05.836657+08	2025-12-22 10:22:38.758127+08	\N
\.


--
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interviews (id, application_id, interview_date, interview_time, location, interviewer_id, status, notes, interview_round, interview_type, interview_topic, interview_duration, interviewer_name, interviewer_position, interview_materials, interview_result, interview_feedback, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, company_id, recruiter_id, title, description, salary, location, experience, degree, type, status, department, work_mode, job_level, hiring_count, urgency, required_skills, preferred_skills, benefits, publish_date, expire_date, views_count, applications_count, match_rate, created_at, updated_at) FROM stdin;
2	1	1	Java后端工程师	负责后端服务的设计和开发	20-30K	北京	2-4年	本科	全职	active	技术部	现场	中级	3	普通	["Java", "Spring Boot", "MySQL"]	["Redis", "Kafka"]	["五险一金", "餐补", "定期体检"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
3	1	1	产品经理	负责产品规划和需求管理	18-28K	北京	3-5年	本科	全职	active	产品部	混合	中级	1	紧急	["产品设计", "需求分析", "原型设计"]	["用户研究", "数据分析"]	["五险一金", "年终奖", "带薪年假"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
6	3	3	电商运营专员	负责店铺运营和推广	15-25K	广州	1-3年	本科	全职	active	运营部	现场	初级	5	普通	["电商运营", "数据分析", "推广"]	["淘宝", "京东", "抖音"]	["五险一金", "绩效提成", "包住"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
7	3	3	客服主管	负责客服团队管理	18-28K	广州	3-5年	本科	全职	active	客服部	混合	中级	2	紧急	["团队管理", "客户服务", "沟通能力"]	["CRM系统", "数据分析"]	["五险一金", "年终奖", "带薪年假"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
8	4	4	在线课程策划	负责在线课程的设计和策划	12-20K	深圳	1-3年	本科	全职	active	课程部	远程	初级	3	普通	["课程设计", "教育心理学", "文案写作"]	["视频剪辑", "教学设计"]	["五险一金", "弹性工作", "远程办公"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
9	4	4	教学顾问	负责学员咨询和课程推荐	10-18K	深圳	0-2年	大专	全职	active	销售部	远程	初级	10	紧急	["销售能力", "沟通能力", "教育背景"]	["在线教育", "心理咨询"]	["五险一金", "提成", "培训"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
10	5	5	产品经理	负责医疗健康产品的规划	20-30K	杭州	3-5年	本科	全职	active	产品部	混合	中级	2	普通	["产品设计", "医疗健康", "需求分析"]	["临床试验", "医疗器械"]	["五险一金", "年终奖", "定期体检"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
11	5	5	市场推广专员	负责产品的市场推广	15-25K	杭州	1-3年	本科	全职	active	市场部	现场	初级	3	紧急	["市场推广", "文案写作", "社交媒体"]	["医疗知识", "数据分析"]	["五险一金", "绩效奖金", "节日福利"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-11-27 14:58:45.936806+08
12	7	6	人工智能算法工程师	负责公司核心AI产品的算法研发，包括机器学习、深度学习等技术方向	30-50K	深圳	3-5年	硕士	全职	active	算法部	混合	高级	2	紧急	["Python", "TensorFlow", "PyTorch", "机器学习"]	["自然语言处理", "计算机视觉", "大模型"]	["五险一金", "年终奖", "股票期权", "弹性工作", "定期体检"]	2025-11-27 15:46:55.235083+08	\N	0	0	0	2025-11-27 15:46:55.235083+08	2025-11-27 15:46:55.235083+08
14	8	8	新能源工程师	负责太阳能、风能等新能源项目的设计和开发	20-35K	北京	2-4年	本科	全职	active	技术部	现场	中级	3	紧急	["新能源技术", "工程设计", "AutoCAD"]	["项目管理", "光伏系统", "风力发电"]	["五险一金", "年终奖", "包住", "餐补", "定期体检"]	2025-11-27 15:46:55.243243+08	\N	0	0	0	2025-11-27 15:46:55.243243+08	2025-11-27 15:46:55.243243+08
15	8	8	市场经理	负责公司新能源产品的市场推广和品牌建设	18-30K	北京	3-5年	本科	全职	active	市场部	混合	中级	1	普通	["市场推广", "品牌建设", "营销策划"]	["新能源行业经验", "数据分析", "新媒体运营"]	["五险一金", "年终奖", "弹性工作", "定期体检"]	2025-11-27 15:46:55.244722+08	\N	0	0	0	2025-11-27 15:46:55.244722+08	2025-11-27 15:46:55.244722+08
16	9	9	物流运营经理	负责公司物流网络的运营管理，优化物流效率	25-40K	上海	3-5年	本科	全职	active	运营部	现场	中级	2	紧急	["物流管理", "运营优化", "团队管理"]	["供应链管理", "数据分析", "ERP系统"]	["五险一金", "年终奖", "餐补", "交通补贴", "定期体检"]	2025-11-27 15:46:55.245809+08	\N	0	0	0	2025-11-27 15:46:55.245809+08	2025-11-27 15:46:55.245809+08
17	9	9	前端开发工程师	负责公司物流管理系统的前端开发	20-35K	上海	2-4年	本科	全职	active	技术部	混合	中级	2	普通	["Vue.js", "JavaScript", "HTML/CSS", "Element UI"]	["React", "TypeScript", "Node.js"]	["五险一金", "年终奖", "弹性工作", "定期体检"]	2025-11-27 15:46:55.246924+08	\N	0	0	0	2025-11-27 15:46:55.246924+08	2025-11-27 15:46:55.246924+08
19	13	1	测试职位 1765541795804	这是一个测试职位描述	25-35K	上海	不限	本科	全职	active		现场	初级	1	普通	{}	{}	{}	2025-12-12 20:16:35.9+08	\N	0	0	0	2025-12-12 20:16:35.902799+08	2025-12-12 20:16:35.902799+08
1	1	1	高级前端工程师测试	负责公司核心产品的前端开发	25-35K	北京	3-5年	本科	全职	active	技术部	混合	高级	2	紧急	["React", "TypeScript", "Vite"]	["GraphQL", "Redis", "Docker"]	["五险一金", "年终奖", "弹性工作"]	2025-11-27 14:58:45.936806+08	\N	0	0	0	2025-11-27 14:58:45.936806+08	2025-12-19 13:51:23.776575+08
23	7	6	WEB开发	职位名称：WEB开发工程师\n\n职位描述：  \n- 负责公司前端页面的开发与优化，确保良好的用户体验与性能表现；  \n- 与产品、设计团队紧密协作，推动项目高效落地；  \n- 参与技术方案设计，持续提升系统架构与代码质量。\n\n任职要求：  \n- 精通HTML语言，具备扎实的前端基础；  \n- 熟悉常见浏览器兼容性处理及响应式布局；  \n- 具备良好的沟通能力和团队协作精神，责任心强。\n\n加分项：  \n- 有Vue/React等前端框架实际开发经验；  \n- 具备一定的UI/UX理解能力，能独立完成页面重构。	15-220K	深圳	1-3年	本科	全职	active	技术部	现场	初级	1	普通	["VUE"]	["VUR"]	["EEEE"]	2025-12-19 12:00:27.20106+08	2028-11-14 00:00:00+08	0	0	0	2025-12-19 12:00:27.20106+08	2025-12-19 15:22:54.296624+08
13	7	6	产品经理	负责AI产品的规划和设计，包括需求分析、产品原型设计等	25-40K	深圳	1-3年	本科	全职	active	产品部	现场	初级	1	普通	["444"]	["33"]	["4444"]	2025-11-27 15:46:55.241349+08	2026-11-25 00:00:00+08	0	0	0	2025-11-27 15:46:55.241349+08	2025-12-19 15:22:33.038746+08
24	7	6	前端开发	职位名称：前端开发\n\n职位描述：  \n- 负责公司核心产品前端功能的开发与优化，提升用户体验与性能表现。  \n- 与设计师、后端工程师紧密协作，完成从需求分析到产品上线的全流程开发工作。  \n- 持续探索并引入前沿前端技术，推动团队技术能力提升。\n\n任职要求：  \n- 精通 Vue.js 框架，具备扎实的 HTML、CSS 及 JavaScript 基础。  \n- 有良好的代码规范意识，熟悉组件化开发及模块化架构。  \n- 具备良好的沟通能力和团队协作精神，能适应快速迭代的开发节奏。\n\n加分项：  \n- 有大型项目实战经验或开源项目贡献者优先。  \n- 熟悉 TypeScript 或主流构建工具（如 Webpack、Vite）者优先。	15-20K	深圳	1-3年	本科	全职	active		现场	初级	1	普通	[]	[]	[]	2025-12-19 12:00:50.129552+08	2025-12-27 00:00:00+08	0	0	0	2025-12-19 12:00:50.129552+08	2025-12-19 15:13:44.066534+08
26	7	6	.NET	{"负责公司核心系统的开发与维护，确保系统稳定运行。","参与需求分析、系统设计及代码实现，提升产品性能和用户体验。","与团队协作，完成高质量的软件开发任务。"}	15-25K	深圳	1-3年	本科	全职	active	技术部	现场	初级	1	普通	["熟练掌握C#语言和.NET框架", "熟悉SQL Server或其他关系型数据库", "具备良好的面向对象编程能力"]	["有ASP.NET Core开发经验", "了解前端技术如HTML/CSS/JavaScript", "具备敏捷开发经验"]	["五险一金", "年度体检", "带薪年假", "节日福利", "培训发展机会"]	2025-12-19 15:28:16.365218+08	\N	0	0	0	2025-12-19 15:28:16.365218+08	2025-12-19 15:28:16.365218+08
27	7	6	上位机	{"负责上位机软件的设计、开发与维护工作。","与硬件团队协作，实现系统集成与调试。","优化用户界面及交互体验，提升产品易用性。"}	15-25K	深圳	1-3年	本科	全职	active	技术部	现场	初级	1	普通	["C#", "WPF", "SQL Server", "Git", "软件架构设计"]	["跨平台开发经验", "多线程编程", "熟悉工业自动化相关知识"]	["五险一金", "年度体检", "带薪年假", "绩效奖金", "职业培训机会"]	2025-12-19 15:29:08.962937+08	2026-10-19 08:00:00+08	0	0	0	2025-12-19 15:29:08.962937+08	2025-12-19 15:29:08.962937+08
25	7	6	AI工程师	职位名称：AI工程师\n\n职位描述：  \n- 负责人工智能算法的设计、开发与优化，推动产品智能化升级；  \n- 参与机器学习模型的构建与训练，提升系统性能与用户体验；  \n- 与产品及研发团队紧密协作，将AI技术落地至实际业务场景中。\n\n任职要求：  \n- 计算机科学、人工智能、数学或相关专业本科及以上学历；  \n- 精通Python编程语言，具备良好的代码规范与工程能力；  \n- 熟悉常见机器学习算法与深度学习框架（如TensorFlow/PyTorch）。\n\n加分项：  \n- 有自然语言处理（NLP）或计算机视觉（CV）项目经验者优先；  \n- 具备独立完成项目从设计到部署全流程的能力。	100-200K	深圳	1-3年	本科	全职	active	技术部	现场	初级	1	普通	[]	[]	[]	2025-12-19 12:23:16.121267+08	2028-12-12 00:00:00+08	0	0	0	2025-12-19 12:23:16.121267+08	2025-12-19 15:13:14.202308+08
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, receiver_id, text, type, status, "time", created_at, file_url, file_name, file_size, file_type, link_title, link_description, link_thumbnail, metadata, is_deleted, deleted_by, deleted_at, updated_at) FROM stdin;
1	31	20	1	您好！我是于吉，很感兴趣Java后端工程师，想了解更多关于这个职位的信息。	text	sent	2025-12-18 15:26:05.363527+08	2025-12-18 15:26:05.363527+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 15:26:05.363527+08
2	31	20	1	您好！我是于吉，很感兴趣Java后端工程师，想了解更多关于这个职位的信息。	text	sent	2025-12-18 15:26:26.553319+08	2025-12-18 15:26:26.553319+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 15:26:26.553319+08
5	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 15:43:56.276099+08	2025-12-18 15:43:56.276099+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 15:43:56.276099+08
6	31	20	1	1	text	sent	2025-12-18 15:56:50.980308+08	2025-12-18 15:56:50.980308+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 15:56:50.980308+08
11	31	20	1	方便电话沟通吗？	text	sent	2025-12-18 16:01:13.899869+08	2025-12-18 16:01:13.899869+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:01:13.899869+08
12	36	20	13	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-18 16:09:57.720965+08	2025-12-18 16:09:57.720965+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:09:57.720965+08
13	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:17:11.330041+08	2025-12-18 16:17:11.330041+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:17:11.330041+08
14	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:17:31.404166+08	2025-12-18 16:17:31.404166+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:17:31.404166+08
15	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:17:56.271785+08	2025-12-18 16:17:56.271785+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:17:56.271785+08
16	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:18:07.805896+08	2025-12-18 16:18:07.805896+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:18:07.805896+08
17	38	20	3	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-18 16:18:30.327095+08	2025-12-18 16:18:30.327095+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:18:30.327095+08
18	39	20	7	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-18 16:19:24.518982+08	2025-12-18 16:19:24.518982+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:19:24.518982+08
19	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:25:38.88612+08	2025-12-18 16:25:38.88612+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:25:38.88612+08
20	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:25:54.433467+08	2025-12-18 16:25:54.433467+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:25:54.433467+08
21	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:26:15.596534+08	2025-12-18 16:26:15.596534+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:26:15.596534+08
22	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:29:09.160916+08	2025-12-18 16:29:09.160916+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:29:09.160916+08
23	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:29:15.730851+08	2025-12-18 16:29:15.730851+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:29:15.730851+08
24	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:33:12.495633+08	2025-12-18 16:33:12.495633+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:33:12.495633+08
25	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 16:33:42.250599+08	2025-12-18 16:33:42.250599+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:33:42.250599+08
27	41	20	5	您好！我是于吉，我想应聘客服主管职位，想了解更多相关信息。	text	sent	2025-12-18 16:37:55.819707+08	2025-12-18 16:37:55.819707+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:37:55.819707+08
45	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:55:57.552962+08	2025-12-18 17:55:57.552962+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:55:57.552962+08
29	36	20	13	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-18 16:41:12.587057+08	2025-12-18 16:41:12.587057+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:41:12.587057+08
30	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:01:25.527533+08	2025-12-18 17:01:25.527533+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:01:25.527533+08
32	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:06:56.783203+08	2025-12-18 17:06:56.783203+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:06:56.783203+08
33	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:07:07.696386+08	2025-12-18 17:07:07.696386+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:07:07.696386+08
35	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:10:30.355499+08	2025-12-18 17:10:30.355499+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:10:30.355499+08
36	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:11:29.48716+08	2025-12-18 17:11:29.48716+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:11:29.48716+08
37	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:26:55.753062+08	2025-12-18 17:26:55.753062+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:26:55.753062+08
39	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:27:30.380715+08	2025-12-18 17:27:30.380715+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:27:30.380715+08
41	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:37:58.712054+08	2025-12-18 17:37:58.712054+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:37:58.712054+08
42	31	20	3	您好！我是于吉，我想应聘Java后端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:42:04.897441+08	2025-12-18 17:42:04.897441+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:42:04.897441+08
28	42	20	6	您好！我是于吉，我想应聘教学顾问职位，想了解更多相关信息。	text	sent	2025-12-18 16:38:05.840776+08	2025-12-18 16:38:05.840776+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 16:38:05.840776+08
44	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:50:31.764127+08	2025-12-18 17:50:31.764127+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 17:50:31.764127+08
34	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:07:22.77068+08	2025-12-18 17:07:22.77068+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 17:07:22.77068+08
43	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:49:51.616237+08	2025-12-18 17:49:51.616237+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 17:49:51.616237+08
38	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:26:58.424461+08	2025-12-18 17:26:58.424461+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 17:26:58.424461+08
46	37	20	5	您好！我是于吉，我想应聘电商运营专员职位，想了解更多相关信息。	text	sent	2025-12-18 22:32:49.590791+08	2025-12-18 22:32:49.590791+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-18 22:32:49.590791+08
47	36	20	13	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-19 08:50:55.902269+08	2025-12-19 08:50:55.902269+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 08:50:55.902269+08
48	40	20	1	已向您发送了我的在线简历附件。	system	sent	2025-12-19 08:52:50.660836+08	2025-12-19 08:52:50.660836+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 08:52:50.660836+08
49	40	20	1	我的微信号是: wx_xiaoming，期待进一步沟通。	text	sent	2025-12-19 08:52:52.570925+08	2025-12-19 08:52:52.570925+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 08:52:52.570925+08
31	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:01:33.785798+08	2025-12-18 17:01:33.785798+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 17:01:33.785798+08
40	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 17:31:57.110203+08	2025-12-18 17:31:57.110203+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 17:31:57.110203+08
50	40	20	1	方便电话沟通吗？	text	sent	2025-12-19 08:52:58.374762+08	2025-12-19 08:52:58.374762+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 08:52:58.374762+08
26	40	20	3	您好！我是于吉，我想应聘高级前端工程师职位，想了解更多相关信息。	text	sent	2025-12-18 16:37:48.48167+08	2025-12-18 16:37:48.48167+08	\N	\N	\N	\N	\N	\N	\N	{}	t	\N	\N	2025-12-18 16:37:48.48167+08
51	38	20	3	您好！我是于吉，我想应聘产品经理职位，想了解更多相关信息。	text	sent	2025-12-19 09:53:39.344001+08	2025-12-19 09:53:39.344001+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 09:53:39.344001+08
52	37	20	3	1	text	sent	2025-12-19 10:37:52.656877+08	2025-12-19 10:37:52.656877+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:52.656877+08
53	37	20	3	2	text	sent	2025-12-19 10:37:54.325467+08	2025-12-19 10:37:54.325467+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:54.325467+08
54	37	20	3	3	text	sent	2025-12-19 10:37:54.813253+08	2025-12-19 10:37:54.813253+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:54.813253+08
55	37	20	3	4	text	sent	2025-12-19 10:37:56.229346+08	2025-12-19 10:37:56.229346+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:56.229346+08
56	37	20	3	5	text	sent	2025-12-19 10:37:56.701291+08	2025-12-19 10:37:56.701291+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:56.701291+08
57	37	20	3	6	text	sent	2025-12-19 10:37:57.17943+08	2025-12-19 10:37:57.17943+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:57.17943+08
58	37	20	3	7	text	sent	2025-12-19 10:37:57.837818+08	2025-12-19 10:37:57.837818+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:57.837818+08
59	37	20	3	8	text	sent	2025-12-19 10:37:58.274561+08	2025-12-19 10:37:58.274561+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:58.274561+08
60	37	20	3	9	text	sent	2025-12-19 10:37:58.73992+08	2025-12-19 10:37:58.73992+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:37:58.73992+08
61	39	20	5	1	text	sent	2025-12-19 10:38:02.500199+08	2025-12-19 10:38:02.500199+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:02.500199+08
62	39	20	5	1	text	sent	2025-12-19 10:38:02.861853+08	2025-12-19 10:38:02.861853+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:02.861853+08
63	39	20	5	1	text	sent	2025-12-19 10:38:03.171052+08	2025-12-19 10:38:03.171052+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:03.171052+08
64	39	20	5	1	text	sent	2025-12-19 10:38:03.458457+08	2025-12-19 10:38:03.458457+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:03.458457+08
65	39	20	5	1	text	sent	2025-12-19 10:38:03.759791+08	2025-12-19 10:38:03.759791+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:03.759791+08
66	39	20	5	1	text	sent	2025-12-19 10:38:04.056734+08	2025-12-19 10:38:04.056734+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:04.056734+08
67	39	20	5	1	text	sent	2025-12-19 10:38:04.356574+08	2025-12-19 10:38:04.356574+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:04.356574+08
68	39	20	5	1	text	sent	2025-12-19 10:38:04.65324+08	2025-12-19 10:38:04.65324+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:04.65324+08
69	38	20	1	1	text	sent	2025-12-19 10:38:07.521445+08	2025-12-19 10:38:07.521445+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:07.521445+08
70	38	20	1	1	text	sent	2025-12-19 10:38:07.955157+08	2025-12-19 10:38:07.955157+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:07.955157+08
71	38	20	1	1	text	sent	2025-12-19 10:38:08.314861+08	2025-12-19 10:38:08.314861+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:08.314861+08
72	38	20	1	1	text	sent	2025-12-19 10:38:08.696149+08	2025-12-19 10:38:08.696149+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:08.696149+08
73	38	20	1	1	text	sent	2025-12-19 10:38:09.015897+08	2025-12-19 10:38:09.015897+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:09.015897+08
74	38	20	1	1	text	sent	2025-12-19 10:38:09.385751+08	2025-12-19 10:38:09.385751+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:09.385751+08
75	38	20	1	1	text	sent	2025-12-19 10:38:09.820517+08	2025-12-19 10:38:09.820517+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:09.820517+08
76	38	20	1	2	text	sent	2025-12-19 10:38:10.348282+08	2025-12-19 10:38:10.348282+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:10.348282+08
77	38	20	1	5	text	sent	2025-12-19 10:38:36.59486+08	2025-12-19 10:38:36.59486+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:36.59486+08
78	36	20	6	2	text	sent	2025-12-19 10:38:57.584172+08	2025-12-19 10:38:57.584172+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:57.584172+08
79	36	20	6	1	text	sent	2025-12-19 10:38:57.772765+08	2025-12-19 10:38:57.772765+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:57.772765+08
80	36	20	6	1	text	sent	2025-12-19 10:38:57.965362+08	2025-12-19 10:38:57.965362+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:57.965362+08
81	36	20	6	2	text	sent	2025-12-19 10:38:58.147452+08	2025-12-19 10:38:58.147452+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:58.147452+08
82	36	20	6	2	text	sent	2025-12-19 10:38:58.327702+08	2025-12-19 10:38:58.327702+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:58.327702+08
83	36	20	6	1	text	sent	2025-12-19 10:38:58.460417+08	2025-12-19 10:38:58.460417+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:38:58.460417+08
84	37	20	3	12.1	text	sent	2025-12-19 10:39:01.0564+08	2025-12-19 10:39:01.0564+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:01.0564+08
85	37	20	3	1	text	sent	2025-12-19 10:39:01.545102+08	2025-12-19 10:39:01.545102+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:01.545102+08
86	37	20	3	1	text	sent	2025-12-19 10:39:01.846504+08	2025-12-19 10:39:01.846504+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:01.846504+08
87	37	20	3	11	text	sent	2025-12-19 10:39:02.096985+08	2025-12-19 10:39:02.096985+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:02.096985+08
88	37	20	3	1	text	sent	2025-12-19 10:39:02.286289+08	2025-12-19 10:39:02.286289+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:02.286289+08
89	37	20	3	1	text	sent	2025-12-19 10:39:02.461541+08	2025-12-19 10:39:02.461541+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:02.461541+08
90	42	20	4	45	text	sent	2025-12-19 10:39:08.723998+08	2025-12-19 10:39:08.723998+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:08.723998+08
91	42	20	4	4	text	sent	2025-12-19 10:39:08.997756+08	2025-12-19 10:39:08.997756+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:08.997756+08
92	42	20	4	4	text	sent	2025-12-19 10:39:09.185954+08	2025-12-19 10:39:09.185954+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:09.185954+08
93	42	20	4	4	text	sent	2025-12-19 10:39:09.36826+08	2025-12-19 10:39:09.36826+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:09.36826+08
94	42	20	4	4	text	sent	2025-12-19 10:39:09.546145+08	2025-12-19 10:39:09.546145+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:09.546145+08
95	42	20	4	5	text	sent	2025-12-19 10:39:09.769317+08	2025-12-19 10:39:09.769317+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:09.769317+08
96	42	20	4	3	text	sent	2025-12-19 10:39:10.146131+08	2025-12-19 10:39:10.146131+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:10.146131+08
97	42	20	4	8	text	sent	2025-12-19 10:39:10.322897+08	2025-12-19 10:39:10.322897+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:10.322897+08
98	42	20	4	8	text	sent	2025-12-19 10:39:10.494722+08	2025-12-19 10:39:10.494722+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:10.494722+08
99	42	20	4	8	text	sent	2025-12-19 10:39:10.68164+08	2025-12-19 10:39:10.68164+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:10.68164+08
100	42	20	4	88	text	sent	2025-12-19 10:39:10.887457+08	2025-12-19 10:39:10.887457+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:10.887457+08
101	42	20	4	8	text	sent	2025-12-19 10:39:11.226632+08	2025-12-19 10:39:11.226632+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:11.226632+08
102	39	20	5	8	text	sent	2025-12-19 10:39:14.316133+08	2025-12-19 10:39:14.316133+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 10:39:14.316133+08
103	43	20	13	您好！我是于吉，我想应聘WEB开发职位，想了解更多相关信息。	text	sent	2025-12-19 12:07:48.620687+08	2025-12-19 12:07:48.620687+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 12:07:48.620687+08
104	43	20	13	您好！我是于吉，我想应聘WEB开发职位，想了解更多相关信息。	text	sent	2025-12-19 12:07:51.435454+08	2025-12-19 12:07:51.435454+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 12:07:51.435454+08
105	43	20	13	您好！我是于吉，我想应聘WEB开发职位，想了解更多相关信息。	text	sent	2025-12-19 12:07:56.997359+08	2025-12-19 12:07:56.997359+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 12:07:56.997359+08
106	43	20	6	1	text	sent	2025-12-19 12:08:15.218646+08	2025-12-19 12:08:15.218646+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 12:08:15.218646+08
107	36	13	19	1	text	sent	2025-12-19 15:16:36.492796+08	2025-12-19 15:16:36.492796+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:16:36.492796+08
108	43	13	19	收到	text	sent	2025-12-19 15:16:42.673637+08	2025-12-19 15:16:42.673637+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:16:42.673637+08
109	36	13	19	🆗	text	sent	2025-12-19 15:16:47.305703+08	2025-12-19 15:16:47.305703+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:16:47.305703+08
110	44	20	13	您好！我是于吉，我想应聘AI工程师职位，想了解更多相关信息。	text	sent	2025-12-19 15:37:28.192404+08	2025-12-19 15:37:28.192404+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:37:28.192404+08
111	44	20	13	您好！我是于吉，我想应聘AI工程师职位，想了解更多相关信息。	text	sent	2025-12-19 15:37:30.672456+08	2025-12-19 15:37:30.672456+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:37:30.672456+08
112	44	20	13	您好！我是于吉，我想应聘AI工程师职位，想了解更多相关信息。	text	sent	2025-12-19 15:37:35.938367+08	2025-12-19 15:37:35.938367+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:37:35.938367+08
113	44	20	6	已向您发送了我的在线简历附件。	system	sent	2025-12-19 15:37:42.922169+08	2025-12-19 15:37:42.922169+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-19 15:37:42.922169+08
114	39	20	5	3	text	sent	2025-12-20 17:19:56.591934+08	2025-12-20 17:19:56.591934+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-20 17:19:56.591934+08
115	39	20	5	2	text	sent	2025-12-20 17:19:58.202746+08	2025-12-20 17:19:58.202746+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-20 17:19:58.202746+08
116	45	20	16	您好！我是于吉，我想应聘物流运营经理职位，想了解更多相关信息。	text	sent	2025-12-20 23:14:26.1837+08	2025-12-20 23:14:26.1837+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-20 23:14:26.1837+08
117	45	20	9	1	text	sent	2025-12-20 23:14:52.861284+08	2025-12-20 23:14:52.861284+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-20 23:14:52.861284+08
118	42	20	6	您好！我是于吉，我想应聘教学顾问职位，想了解更多相关信息。	text	sent	2025-12-22 10:22:25.317701+08	2025-12-22 10:22:25.317701+08	\N	\N	\N	\N	\N	\N	\N	{}	f	\N	\N	2025-12-22 10:22:25.317701+08
\.


--
-- Data for Name: onboardings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onboardings (id, application_id, onboarding_date, status, notes, onboarding_time, onboarding_location, onboarding_contact, onboarding_contact_phone, required_documents, submitted_documents, onboarding_steps, completed_steps, official_salary, probation_salary, probation_period, official_benefits, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recruiter_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruiter_user (id, user_id, company_id, is_verified, business_license, contact_info, verification_status, verification_date, created_at, updated_at) FROM stdin;
1	5	3	f			pending	\N	2025-11-27 23:30:48.359964	2025-11-27 23:30:48.359964
2	6	4	f			pending	\N	2025-11-27 23:30:48.364684	2025-11-27 23:30:48.364684
3	7	5	f			pending	\N	2025-11-27 23:30:48.366038	2025-11-27 23:30:48.366038
5	4	10	f			pending	\N	2025-11-27 23:30:48.368338	2025-11-27 23:30:48.368338
6	12	11	f			pending	\N	2025-11-27 23:30:48.369279	2025-11-27 23:30:48.369279
9	15	8	f			pending	\N	2025-11-27 23:30:48.371659	2025-11-27 23:30:48.371659
10	16	9	f			pending	\N	2025-11-27 23:30:48.372508	2025-11-27 23:30:48.372508
11	17	9	f			pending	\N	2025-11-27 23:30:48.37305	2025-11-27 23:30:48.37305
14	2	12	t			pending	2025-12-01 13:58:01.514938	2025-12-01 13:58:01.514938	2025-12-01 15:38:17.060581
4	3	1	f	/business_license/科技有限公司_营业执照_1766114490594_2811.jpg		pending	\N	2025-11-27 23:30:48.366856	2025-12-19 11:21:30.605702
12	19	1	t	/business_license/科技有限公司_营业执照_1766114490594_2811.jpg	梁金，13800138001	approved	\N	2025-11-27 23:35:13.904736	2025-12-19 11:21:30.605702
13	20	1	t	/business_license/科技有限公司_营业执照_1766114490594_2811.jpg	于吉，13800138002	pending	\N	2025-11-27 23:35:13.965271	2025-12-19 11:21:30.605702
8	14	7	f	/business_license/创新科技有限公司_营业执照_1766114532213_4664.jpg		pending	\N	2025-11-27 23:30:48.371067	2025-12-19 11:22:12.223747
7	13	7	t	/business_license/创新科技有限公司_营业执照_1766114532213_4664.jpg		pending	\N	2025-11-27 23:30:48.370294	2025-12-19 12:16:25.125952
\.


--
-- Data for Name: recruiters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruiters (id, user_id, company_id, "position", department, responsibility, is_verified, verification_date, posted_jobs_count, reviewed_applications_count, created_at, updated_at) FROM stdin;
1	3	1	招聘经理	人力资源部	\N	t	\N	3	0	2025-11-27 14:58:45.936806+08	2025-11-27 15:46:55.251309+08
3	5	3	招聘专员	招聘部	\N	t	\N	2	0	2025-11-27 14:58:45.936806+08	2025-11-27 15:46:55.251309+08
4	6	4	HR经理	人事行政部	\N	t	\N	2	0	2025-11-27 14:58:45.936806+08	2025-11-27 15:46:55.251309+08
5	7	5	招聘主管	人力资源部	\N	t	\N	2	0	2025-11-27 14:58:45.936806+08	2025-11-27 15:46:55.251309+08
6	13	7	招聘总监	人力资源部	\N	t	\N	2	0	2025-11-27 15:44:49.693283+08	2025-11-27 15:46:55.251309+08
7	14	7	高级招聘专员	招聘部	\N	t	\N	0	0	2025-11-27 15:44:49.698532+08	2025-11-27 15:46:55.251309+08
8	15	8	HR经理	人力资源中心	\N	t	\N	2	0	2025-11-27 15:44:49.700514+08	2025-11-27 15:46:55.251309+08
9	16	9	招聘主管	人事行政部	\N	t	\N	2	0	2025-11-27 15:44:49.701952+08	2025-11-27 15:46:55.251309+08
10	17	9	招聘专员	招聘部	\N	t	\N	0	0	2025-11-27 15:44:49.703112+08	2025-11-27 15:46:55.251309+08
11	4	10	\N	\N	\N	f	\N	0	0	2025-11-27 23:30:48.368+08	2025-12-19 12:20:59.713787+08
12	12	11	\N	\N	\N	f	\N	0	0	2025-11-27 23:30:48.369+08	2025-12-19 12:20:59.720301+08
13	2	12	\N	\N	\N	t	\N	0	0	2025-12-01 13:58:01.514+08	2025-12-19 12:20:59.721131+08
14	19	1	\N	\N	\N	t	\N	0	0	2025-11-27 23:35:13.904+08	2025-12-19 12:20:59.721633+08
15	20	1	\N	\N	\N	t	\N	0	0	2025-11-27 23:35:13.965+08	2025-12-19 12:20:59.722458+08
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resumes (id, candidate_id, resume_title, is_default, education, work_experience, projects, skills, certifications, languages, self_evaluation, awards, trainings, patents, papers, portfolio_links, view_count, download_count, resume_file_url, resume_file_name, resume_file_size, created_at, updated_at, file_type, upload_ip, upload_time, is_public) FROM stdin;
5	20	test.txt	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/1/1_管理员_1766132924561.txt	test.txt	21	2025-12-19 16:28:44.566662+08	2025-12-19 16:28:44.566662+08	txt	::1	2025-12-19 08:28:44.566	f
7	20	ä¸­æç®åæµè¯.txt	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/1/1_管理员_1766133392480.txt	ä¸­æç®åæµè¯.txt	24	2025-12-19 16:36:32.487494+08	2025-12-19 16:36:32.487494+08	txt	::1	2025-12-19 08:36:32.486	f
8	20	测试简历	f	[{"major": "测试专业", "degree": "本科", "school": "测试学校", "end_date": "2023-06-01", "start_date": "2019-09-01", "description": "测试描述"}]	[]	[]	["测试技能"]	[]	[]	测试自我评价	[]	[]	[]	[]	[]	0	0	\N	\N	\N	2025-12-19 16:47:45.914586+08	2025-12-19 16:47:45.914586+08	\N	\N	\N	f
9	20	test_resume.txt	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/test_resume_1_1766134072534.txt	test_resume.txt	21	2025-12-19 16:47:52.535659+08	2025-12-19 16:47:52.535659+08	txt	::1	2025-12-19 08:47:52.535	f
10	19	NNNUå¹³é¢è®¾è®¡.pdf	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/NNNUå¹³é¢è®¾è®¡_20_1766134363905.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 16:52:43.923772+08	2025-12-19 16:52:43.923772+08	pdf	::1	2025-12-19 08:52:43.922	f
11	19	NNNUå¹³é¢è®¾è®¡.pdf	f	[]	[]	[]	[]	[]	[]		[]	[]	[]	[]	[]	0	0	/User_Resume/NNNUå¹³é¢è®¾è®¡_20_1766134377617.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 16:52:57.633394+08	2025-12-19 16:53:10.783914+08	pdf	::1	2025-12-19 08:52:57.632	f
12	19	1	f	[]	[]	[]	[]	[]	[]		[]	[]	[]	[]	[]	0	0	/User_Resume/NNNUå¹³é¢è®¾è®¡_20_1766134579809.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 16:56:19.823601+08	2025-12-19 16:56:27.646351+08	pdf	::1	2025-12-19 08:56:19.822	f
13	19	NNNUå¹³é¢è®¾è®¡.pdf	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/NNNUå¹³é¢è®¾è®¡_20_1766134590442.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 16:56:30.456269+08	2025-12-19 16:56:30.456269+08	pdf	::1	2025-12-19 08:56:30.455	f
14	19	NNNUå¹³é¢è®¾è®¡.pdf	f	[]	[]	[]	[]	[]	[]	\N	[]	[]	[]	[]	[]	0	0	/User_Resume/NNNUå¹³é¢è®¾è®¡_20_1766134710212.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 16:58:30.229157+08	2025-12-19 16:58:30.229157+08	pdf	::1	2025-12-19 08:58:30.228	f
15	19	NNNUå¹³é¢è®¾è®¡.pdf	f	{}	{}	{}	{}	{}	{}		{}	{}	{}	[]	{}	0	0	/User_Resume/NNNU平面设计_20_1766138237444.pdf	NNNUå¹³é¢è®¾è®¡.pdf	205913	2025-12-19 17:57:17.462223+08	2025-12-19 19:08:56.24871+08	pdf	::1	2025-12-19 09:57:17.461	f
\.


--
-- Data for Name: saved_companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_companies (id, user_id, company_id, created_at) FROM stdin;
1	1	1	2025-12-02 10:06:35.838075+08
2	1	4	2025-12-02 10:06:37.242797+08
4	1	3	2025-12-02 10:10:05.351703+08
6	1	5	2025-12-02 10:12:39.323531+08
43	20	1	2025-12-02 14:49:39.623333+08
49	20	3	2025-12-18 13:44:46.136873+08
\.


--
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_jobs (id, user_id, job_id, created_at) FROM stdin;
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (id, user_id, action, description, ip_address, created_at, log_type, resource_type, resource_id, request_method, request_url, request_params, response_status, response_time, error_code, error_message, stack_trace, user_agent, device_type, browser, os, country, region, city, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
1	18	candidate	2025-11-27 20:26:17.910189+08
2	5	recruiter	2025-11-27 20:26:17.910189+08
3	6	recruiter	2025-11-27 20:26:17.910189+08
4	7	recruiter	2025-11-27 20:26:17.910189+08
5	8	candidate	2025-11-27 20:26:17.910189+08
6	9	candidate	2025-11-27 20:26:17.910189+08
7	10	candidate	2025-11-27 20:26:17.910189+08
8	3	recruiter	2025-11-27 20:26:17.910189+08
9	1	admin	2025-11-27 20:26:17.910189+08
10	4	recruiter	2025-11-27 20:26:17.910189+08
11	12	recruiter	2025-11-27 20:26:17.910189+08
12	2	candidate	2025-11-27 20:26:17.910189+08
13	13	recruiter	2025-11-27 20:26:17.910189+08
14	14	recruiter	2025-11-27 20:26:17.910189+08
15	15	recruiter	2025-11-27 20:26:17.910189+08
16	16	recruiter	2025-11-27 20:26:17.910189+08
17	17	recruiter	2025-11-27 20:26:17.910189+08
18	11	candidate	2025-11-27 20:26:17.910189+08
19	19	candidate	2025-11-27 23:35:13.899458+08
20	19	recruiter	2025-11-27 23:35:13.902385+08
21	20	candidate	2025-11-27 23:35:13.963091+08
22	20	recruiter	2025-11-27 23:35:13.964201+08
23	2	recruiter	2025-12-01 13:58:01.503248+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, phone, avatar, gender, birth_date, education, major, school, graduation_year, work_experience_years, desired_position, skills, languages, emergency_contact, emergency_phone, address, wechat, linkedin, github, personal_website, id_card, nationality, political_status, marital_status, status, email_verified, phone_verified, resume_completeness, last_login_at, last_login_ip, registration_ip, created_at, updated_at, "position") FROM stdin;
8	求职者1	candidate1@example.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138010	/avatars/qiuzhizhe1_candidate1_1764255327939.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-11-27 22:56:10.65315+08	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-01 17:09:33.09923+08	\N
13	李娜	lina@innovationtech.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138002	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	\N	\N	\N	2025-11-27 15:44:49.689649+08	2025-12-19 12:16:25.104997+08	CEO
20	于吉	yuji@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	15977846354	/avatars/yuji_yuji_1764584177288.jpg	男	2025-11-20	Bachelor	人工智能	NNNU	2026	3	前端开发	\N	{}	\N	\N	\N	yuji_wechat	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-12-02 14:44:29.264936+08	\N	\N	2025-11-27 23:35:13.96146+08	2025-12-19 15:57:59.327392+08	\N
7	孙七	sunqi@health.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138005	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-18 14:44:04.447261+08	\N
3	张三	zhangsan@tech.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138001	/avatars/zhangsan_zhangsan_1764566450159.jpg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-12-01 13:46:31.762221+08	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-01 15:35:03.959967+08	\N
5	王五	wangwu@ecommerce.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138003	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-18 14:44:05.285718+08	\N
9	求职者2	candidate2@example.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138011	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-11-27 22:55:54.313791+08	\N	\N	2025-11-27 14:58:45.936806+08	2025-11-27 22:56:01.568137+08	\N
11	aiwen	aiwen@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	15141521631	/avatars/aiwen_aiwen_1764246109480.jpg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-12-01 17:10:04.4013+08	\N	\N	2025-11-27 15:15:15.476654+08	2025-12-01 17:10:04.4013+08	\N
6	赵六	zhaoliu@education.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138004	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-18 14:44:06.640676+08	\N
18	艾西	aixi@example.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138000	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-11-27 20:16:39.881536+08	\N	\N	2025-11-27 16:45:29.620867+08	2025-12-18 14:44:07.480566+08	\N
14	王强	wangqiang@innovationtech.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138003	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	\N	\N	\N	2025-11-27 15:44:49.697772+08	2025-12-18 14:45:08.099416+08	\N
2	艾希	aixi@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138000	/avatars/aixi_aixi_1764568922299.jpg	\N	\N	\N	\N	\N	\N	0	\N	{}	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-12-01 15:28:12.832029+08	\N	\N	2025-11-27 14:52:29.584202+08	2025-12-01 15:38:17.044393+08	\N
15	张敏	zhangmin@greenenergy.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138004	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	\N	\N	\N	2025-11-27 15:44:49.699944+08	2025-12-18 14:45:08.109244+08	\N
12	huwanxi	huwanxi@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	15263521478	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 15:18:14.309849+08	2025-12-18 14:45:09.154308+08	\N
19	梁金	liangjin@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138001	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 23:35:13.896595+08	2025-12-18 14:45:09.708967+08	\N
16	刘杰	liujie@smartlogistics.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138005	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	2025-12-01 17:09:38.823903+08	\N	\N	2025-11-27 15:44:49.701583+08	2025-12-18 14:45:10.582658+08	\N
4	李四	lisi@finance.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138002	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	2025-11-27 15:16:22.968515+08	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-18 14:43:58.852563+08	\N
10	求职者3	candidate3@example.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138012	/avatars/yuji_yuji_1764584177288.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	f	f	0	\N	\N	\N	2025-11-27 14:58:45.936806+08	2025-12-18 14:44:01.320898+08	\N
17	陈丽	chenli@smartlogistics.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	13800138006	/avatars/qiuzhizhe2_candidate2_1764255361565.jpg	\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	\N	\N	\N	2025-11-27 15:44:49.702625+08	2025-12-18 14:45:12.545473+08	\N
1	管理员	admin@163.com	$2b$10$TfgQY0rgp0WPJt.7ZiEFDuBuM7geFIJwybRTcxI.RTxs81j7iO1Iy	\N		\N	\N	\N	\N	\N	\N	0	\N	[]	[]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	t	t	0	2025-12-02 13:02:18.489795+08	\N	\N	2025-11-27 13:52:05.658452+08	2025-12-18 14:45:16.254544+08	\N
\.


--
-- Name: ai_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_sessions_id_seq', 57, true);


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_id_seq', 9, true);


--
-- Name: candidate_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidate_user_id_seq', 8, true);


--
-- Name: candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidates_id_seq', 20, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 13, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 45, true);


--
-- Name: interviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interviews_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 27, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 118, true);


--
-- Name: onboardings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onboardings_id_seq', 1, false);


--
-- Name: recruiter_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruiter_user_id_seq', 14, true);


--
-- Name: recruiters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruiters_id_seq', 15, true);


--
-- Name: resumes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resumes_id_seq', 15, true);


--
-- Name: saved_companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_companies_id_seq', 49, true);


--
-- Name: saved_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_jobs_id_seq', 1, false);


--
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 23, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: ai_sessions ai_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_sessions
    ADD CONSTRAINT ai_sessions_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: candidate_user candidate_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_user
    ADD CONSTRAINT candidate_user_pkey PRIMARY KEY (id);


--
-- Name: candidate_user candidate_user_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_user
    ADD CONSTRAINT candidate_user_user_id_key UNIQUE (user_id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: onboardings onboardings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT onboardings_pkey PRIMARY KEY (id);


--
-- Name: recruiter_user recruiter_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_user
    ADD CONSTRAINT recruiter_user_pkey PRIMARY KEY (id);


--
-- Name: recruiter_user recruiter_user_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_user
    ADD CONSTRAINT recruiter_user_user_id_key UNIQUE (user_id);


--
-- Name: recruiters recruiters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: saved_companies saved_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_companies
    ADD CONSTRAINT saved_companies_pkey PRIMARY KEY (id);


--
-- Name: saved_companies saved_companies_user_id_company_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_companies
    ADD CONSTRAINT saved_companies_user_id_company_id_key UNIQUE (user_id, company_id);


--
-- Name: saved_jobs saved_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (id);


--
-- Name: saved_jobs saved_jobs_user_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_user_id_job_id_key UNIQUE (user_id, job_id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_sessions_user_id ON public.ai_sessions USING btree (user_id);


--
-- Name: idx_applications_applied_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_applied_date ON public.applications USING btree (applied_date DESC);


--
-- Name: idx_applications_candidate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_candidate_id ON public.applications USING btree (candidate_id);


--
-- Name: idx_applications_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_job_id ON public.applications USING btree (job_id);


--
-- Name: idx_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applications_status ON public.applications USING btree (status);


--
-- Name: idx_candidate_user_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidate_user_user_id ON public.candidate_user USING btree (user_id);


--
-- Name: idx_candidates_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_city ON public.candidates USING btree (city);


--
-- Name: idx_candidates_job_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_job_status ON public.candidates USING btree (job_status);


--
-- Name: idx_candidates_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_user_id ON public.candidates USING btree (user_id);


--
-- Name: idx_companies_industry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_industry ON public.companies USING btree (industry);


--
-- Name: idx_companies_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_name ON public.companies USING btree (name);


--
-- Name: idx_conversations_candidate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_candidate_id ON public.conversations USING btree (candidate_id);


--
-- Name: idx_conversations_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_job_id ON public.conversations USING btree (job_id);


--
-- Name: idx_conversations_recruiter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_recruiter_id ON public.conversations USING btree (recruiter_id);


--
-- Name: idx_interviews_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interviews_application_id ON public.interviews USING btree (application_id);


--
-- Name: idx_interviews_interview_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interviews_interview_date ON public.interviews USING btree (interview_date);


--
-- Name: idx_interviews_interviewer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interviews_interviewer_id ON public.interviews USING btree (interviewer_id);


--
-- Name: idx_jobs_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_company_id ON public.jobs USING btree (company_id);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_created_at ON public.jobs USING btree (created_at DESC);


--
-- Name: idx_jobs_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_location ON public.jobs USING btree (location);


--
-- Name: idx_jobs_recruiter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_recruiter_id ON public.jobs USING btree (recruiter_id);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_status ON public.jobs USING btree (status);


--
-- Name: idx_jobs_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_title ON public.jobs USING btree (title);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_messages_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_time ON public.messages USING btree ("time" DESC);


--
-- Name: idx_onboardings_application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_onboardings_application_id ON public.onboardings USING btree (application_id);


--
-- Name: idx_onboardings_onboarding_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_onboardings_onboarding_date ON public.onboardings USING btree (onboarding_date);


--
-- Name: idx_recruiter_user_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruiter_user_company_id ON public.recruiter_user USING btree (company_id);


--
-- Name: idx_recruiter_user_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruiter_user_user_id ON public.recruiter_user USING btree (user_id);


--
-- Name: idx_recruiter_user_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruiter_user_verification_status ON public.recruiter_user USING btree (verification_status);


--
-- Name: idx_recruiters_company_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruiters_company_id ON public.recruiters USING btree (company_id);


--
-- Name: idx_recruiters_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruiters_user_id ON public.recruiters USING btree (user_id);


--
-- Name: idx_resumes_candidate_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resumes_candidate_id ON public.resumes USING btree (candidate_id);


--
-- Name: idx_system_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);


--
-- Name: idx_system_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_user_id ON public.system_logs USING btree (user_id);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: ai_sessions update_ai_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_sessions_updated_at BEFORE UPDATE ON public.ai_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: applications update_applications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: candidate_user update_candidate_user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_candidate_user_updated_at BEFORE UPDATE ON public.candidate_user FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: candidates update_candidates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: interviews update_interviews_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: onboardings update_onboardings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_onboardings_updated_at BEFORE UPDATE ON public.onboardings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recruiter_user update_recruiter_user_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_recruiter_user_updated_at BEFORE UPDATE ON public.recruiter_user FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recruiters update_recruiters_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON public.recruiters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resumes update_resumes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_sessions ai_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_sessions
    ADD CONSTRAINT ai_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: applications applications_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: applications applications_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE SET NULL;


--
-- Name: candidate_user candidate_user_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidate_user
    ADD CONSTRAINT candidate_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: candidates candidates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(id) ON DELETE CASCADE;


--
-- Name: interviews interviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: interviews interviews_interviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_interviewer_id_fkey FOREIGN KEY (interviewer_id) REFERENCES public.recruiters(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: onboardings onboardings_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboardings
    ADD CONSTRAINT onboardings_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: recruiter_user recruiter_user_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_user
    ADD CONSTRAINT recruiter_user_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: recruiter_user recruiter_user_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_user
    ADD CONSTRAINT recruiter_user_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recruiters recruiters_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: recruiters recruiters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resumes resumes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: saved_companies saved_companies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_companies
    ADD CONSTRAINT saved_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: saved_companies saved_companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_companies
    ADD CONSTRAINT saved_companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: saved_jobs saved_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict agz1UtpJSwJcUz5NTZUgCGJcoFzkPRoZjx9B4A3uvjVLtoS5tg2nYmC95L5pbql

