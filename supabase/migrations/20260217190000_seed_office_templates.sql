-- =====================================================
-- Seed rich starter templates for Office
-- These are workspace-scoped but marked is_public = true
-- so they appear for ALL workspaces via the OR query.
-- Uses the first available workspace as the "system" owner.
-- =====================================================

-- Add index on is_public for efficient cross-workspace template queries
CREATE INDEX IF NOT EXISTS idx_office_templates_is_public
  ON public.office_templates (is_public)
  WHERE is_public = true;

-- Allow any authenticated user to READ public templates (cross-workspace)
DROP POLICY IF EXISTS "office_templates_public_read" ON public.office_templates;
CREATE POLICY "office_templates_public_read"
  ON public.office_templates
  FOR SELECT
  USING (is_public = true AND auth.uid() IS NOT NULL);

DO $$
DECLARE
  v_ws_id uuid;
  v_user_id uuid;
BEGIN
  -- Pick the oldest workspace as the system template owner
  SELECT id INTO v_ws_id FROM public.workspaces ORDER BY created_at ASC LIMIT 1;
  IF v_ws_id IS NULL THEN
    RAISE NOTICE 'No workspaces found, skipping template seed';
    RETURN;
  END IF;

  -- Pick the workspace owner as the creator
  SELECT wm.user_id INTO v_user_id
    FROM public.workspace_members wm
    WHERE wm.workspace_id = v_ws_id AND wm.role = 'owner'
    LIMIT 1;

  -- ==================== DOCUMENTS ====================

  INSERT INTO public.office_templates (workspace_id, title, slug, description, category, template_json, tags, is_public, created_by)
  VALUES
  -- 1. Business Proposal
  (v_ws_id, 'Business Proposal', 'business-proposal',
   'Professional business proposal with executive summary, scope of work, timeline, and pricing sections',
   'document',
   '{
     "sections": [
       {"title": "Cover Page", "content": "# [Company Name]\n## Business Proposal\n\nPrepared for: [Client Name]\nDate: [Date]\nPrepared by: [Your Name]"},
       {"title": "Executive Summary", "content": "Provide a brief overview of your proposal, key benefits, and expected outcomes."},
       {"title": "Problem Statement", "content": "Describe the client''s challenge or opportunity you are addressing."},
       {"title": "Proposed Solution", "content": "Detail your approach, methodology, and deliverables."},
       {"title": "Scope of Work", "content": "- Phase 1: Discovery & Research\n- Phase 2: Strategy & Planning\n- Phase 3: Implementation\n- Phase 4: Review & Optimization"},
       {"title": "Timeline", "content": "| Phase | Duration | Start | End |\n|-------|----------|-------|-----|\n| Discovery | 2 weeks | | |\n| Planning | 1 week | | |\n| Implementation | 4 weeks | | |\n| Review | 1 week | | |"},
       {"title": "Investment", "content": "| Item | Cost |\n|------|------|\n| Consulting | $X,XXX |\n| Implementation | $X,XXX |\n| Support (3 months) | $X,XXX |\n| **Total** | **$XX,XXX** |"},
       {"title": "Terms & Conditions", "content": "Payment terms, intellectual property, confidentiality clauses."},
       {"title": "Next Steps", "content": "1. Review and approve proposal\n2. Sign agreement\n3. Kick-off meeting"}
     ]
   }'::jsonb,
   array['business', 'proposal', 'sales', 'professional'],
   true, v_user_id),

  -- 2. Meeting Minutes
  (v_ws_id, 'Meeting Minutes', 'meeting-minutes',
   'Structured meeting notes template with attendees, agenda, decisions, and action items',
   'document',
   '{
     "sections": [
       {"title": "Meeting Details", "content": "**Date:** [Date]\n**Time:** [Start] - [End]\n**Location:** [Room/Link]\n**Facilitator:** [Name]"},
       {"title": "Attendees", "content": "| Name | Role | Present |\n|------|------|---------|\n| | | ✅ |\n| | | ✅ |\n| | | ❌ |"},
       {"title": "Agenda", "content": "1. Review of previous action items\n2. [Topic 1]\n3. [Topic 2]\n4. Open discussion\n5. Next steps"},
       {"title": "Discussion Notes", "content": "### Topic 1\n\n### Topic 2\n\n### Open Discussion"},
       {"title": "Decisions Made", "content": "1. \n2. \n3. "},
       {"title": "Action Items", "content": "| # | Action | Owner | Due Date | Status |\n|---|--------|-------|----------|--------|\n| 1 | | | | 🔲 |\n| 2 | | | | 🔲 |\n| 3 | | | | 🔲 |"},
       {"title": "Next Meeting", "content": "**Date:** [Date]\n**Time:** [Time]\n**Agenda Preview:** "}
     ]
   }'::jsonb,
   array['meeting', 'notes', 'productivity', 'team'],
   true, v_user_id),

  -- 3. Project Brief
  (v_ws_id, 'Project Brief', 'project-brief',
   'Comprehensive project brief with objectives, stakeholders, risks, and success criteria',
   'document',
   '{
     "sections": [
       {"title": "Project Overview", "content": "**Project Name:** [Name]\n**Project Manager:** [Name]\n**Start Date:** [Date]\n**Target Completion:** [Date]\n**Priority:** High / Medium / Low"},
       {"title": "Background & Context", "content": "Describe why this project is needed and the business context."},
       {"title": "Objectives", "content": "1. **Primary:** \n2. **Secondary:** \n3. **Stretch:** "},
       {"title": "Scope", "content": "### In Scope\n- \n- \n\n### Out of Scope\n- \n- "},
       {"title": "Stakeholders", "content": "| Name | Role | Responsibility |\n|------|------|----------------|\n| | Sponsor | Final approval |\n| | PM | Day-to-day management |\n| | Lead | Technical decisions |"},
       {"title": "Success Criteria", "content": "- [ ] Criterion 1\n- [ ] Criterion 2\n- [ ] Criterion 3"},
       {"title": "Risks & Mitigations", "content": "| Risk | Impact | Likelihood | Mitigation |\n|------|--------|------------|------------|\n| | High | Medium | |\n| | Medium | Low | |"},
       {"title": "Budget", "content": "**Total Budget:** $[Amount]\n\n| Category | Allocation |\n|----------|------------|\n| Personnel | |\n| Tools | |\n| Contingency (10%) | |"},
       {"title": "Approval", "content": "| Name | Signature | Date |\n|------|-----------|------|\n| | | |"}
     ]
   }'::jsonb,
   array['project', 'management', 'brief', 'planning'],
   true, v_user_id),

  -- 4. Weekly Status Report
  (v_ws_id, 'Weekly Status Report', 'weekly-status-report',
   'Concise weekly update template with progress, blockers, and next week plans',
   'document',
   '{
     "sections": [
       {"title": "Report Header", "content": "**Week of:** [Date Range]\n**Team/Project:** [Name]\n**Reported by:** [Name]\n**Overall Status:** 🟢 On Track / 🟡 At Risk / 🔴 Blocked"},
       {"title": "Key Accomplishments", "content": "- ✅ \n- ✅ \n- ✅ "},
       {"title": "In Progress", "content": "- 🔄 [Task] — [% complete]\n- 🔄 [Task] — [% complete]"},
       {"title": "Blockers & Risks", "content": "| Blocker | Impact | Owner | Resolution ETA |\n|---------|--------|-------|----------------|\n| | | | |"},
       {"title": "Next Week Plan", "content": "- [ ] Priority 1: \n- [ ] Priority 2: \n- [ ] Priority 3: "},
       {"title": "Metrics", "content": "| Metric | Target | Actual | Trend |\n|--------|--------|--------|-------|\n| | | | ↑ |\n| | | | → |"},
       {"title": "Help Needed", "content": "Any requests or escalations for leadership."}
     ]
   }'::jsonb,
   array['report', 'weekly', 'status', 'management'],
   true, v_user_id),

  -- 5. Content Calendar
  (v_ws_id, 'Content Calendar', 'content-calendar',
   'Monthly content planning template for social media, blog, and marketing campaigns',
   'document',
   '{
     "sections": [
       {"title": "Month Overview", "content": "**Month:** [Month Year]\n**Content Manager:** [Name]\n**Theme:** [Monthly Theme]\n**Key Dates/Events:** "},
       {"title": "Content Goals", "content": "1. Publish [X] blog posts\n2. [X] social media posts per week\n3. [X] email newsletters\n4. Target: [X] new leads / [X]% engagement increase"},
       {"title": "Week 1", "content": "| Day | Platform | Content Type | Topic | Status |\n|-----|----------|-------------|-------|--------|\n| Mon | Blog | Article | | 🔲 |\n| Tue | Instagram | Carousel | | 🔲 |\n| Wed | LinkedIn | Post | | 🔲 |\n| Thu | Email | Newsletter | | 🔲 |\n| Fri | Twitter/X | Thread | | 🔲 |"},
       {"title": "Week 2", "content": "| Day | Platform | Content Type | Topic | Status |\n|-----|----------|-------------|-------|--------|\n| Mon | | | | 🔲 |\n| Tue | | | | 🔲 |\n| Wed | | | | 🔲 |\n| Thu | | | | 🔲 |\n| Fri | | | | 🔲 |"},
       {"title": "Week 3", "content": "| Day | Platform | Content Type | Topic | Status |\n|-----|----------|-------------|-------|--------|\n| Mon | | | | 🔲 |\n| Tue | | | | 🔲 |\n| Wed | | | | 🔲 |\n| Thu | | | | 🔲 |\n| Fri | | | | 🔲 |"},
       {"title": "Week 4", "content": "| Day | Platform | Content Type | Topic | Status |\n|-----|----------|-------------|-------|--------|\n| Mon | | | | 🔲 |\n| Tue | | | | 🔲 |\n| Wed | | | | 🔲 |\n| Thu | | | | 🔲 |\n| Fri | | | | 🔲 |"},
       {"title": "Performance Review", "content": "| Metric | Goal | Actual |\n|--------|------|--------|\n| Total Reach | | |\n| Engagement Rate | | |\n| New Followers | | |\n| Leads Generated | | |"}
     ]
   }'::jsonb,
   array['marketing', 'content', 'calendar', 'social-media'],
   true, v_user_id),

  -- 6. Employee Onboarding Checklist
  (v_ws_id, 'Employee Onboarding', 'employee-onboarding',
   'New hire onboarding checklist with pre-arrival, first day, first week, and first month tasks',
   'document',
   '{
     "sections": [
       {"title": "New Hire Info", "content": "**Name:** [Name]\n**Position:** [Title]\n**Department:** [Dept]\n**Start Date:** [Date]\n**Manager:** [Name]\n**Buddy:** [Name]"},
       {"title": "Pre-Arrival (HR)", "content": "- [ ] Send offer letter & contracts\n- [ ] Set up email & accounts\n- [ ] Order equipment (laptop, monitor, phone)\n- [ ] Prepare workspace/desk\n- [ ] Add to Slack/Teams channels\n- [ ] Schedule orientation meetings\n- [ ] Send welcome package"},
       {"title": "Day 1", "content": "- [ ] Welcome meeting with manager\n- [ ] Office tour / virtual workspace tour\n- [ ] IT setup & password configuration\n- [ ] Review company handbook\n- [ ] Meet the team lunch\n- [ ] Set up development environment (if applicable)\n- [ ] Access to project management tools"},
       {"title": "Week 1", "content": "- [ ] Complete mandatory training modules\n- [ ] 1:1 with direct manager (goals & expectations)\n- [ ] Meet key stakeholders\n- [ ] Review current projects & roadmap\n- [ ] Shadow team members\n- [ ] First small task/contribution"},
       {"title": "Month 1", "content": "- [ ] Complete all compliance training\n- [ ] 30-day check-in with manager\n- [ ] Set 90-day goals\n- [ ] Contribute to first project/sprint\n- [ ] Provide onboarding feedback\n- [ ] Join relevant recurring meetings"},
       {"title": "Success Metrics (90 Days)", "content": "- [ ] Fully autonomous in daily tasks\n- [ ] Completed first major deliverable\n- [ ] Positive peer feedback\n- [ ] Understands company culture & values"}
     ]
   }'::jsonb,
   array['hr', 'onboarding', 'checklist', 'employee'],
   true, v_user_id),

  -- ==================== SPREADSHEETS ====================

  -- 7. Expense Tracker
  (v_ws_id, 'Expense Tracker', 'expense-tracker',
   'Monthly expense tracking spreadsheet with categories, amounts, and budget comparison',
   'spreadsheet',
   '{
     "columns": ["Date", "Category", "Description", "Amount", "Payment Method", "Receipt", "Notes"],
     "categories": ["Rent/Mortgage", "Utilities", "Groceries", "Transportation", "Insurance", "Healthcare", "Entertainment", "Subscriptions", "Dining Out", "Shopping", "Education", "Savings", "Other"],
     "summary": {
       "headers": ["Category", "Budgeted", "Actual", "Difference", "% Used"],
       "formulas": {"difference": "=Budgeted-Actual", "percent": "=Actual/Budgeted*100"}
     },
     "sample_data": [
       {"date": "2026-01-01", "category": "Rent/Mortgage", "description": "Monthly rent", "amount": 1500, "method": "Bank Transfer"},
       {"date": "2026-01-03", "category": "Groceries", "description": "Weekly groceries", "amount": 85.50, "method": "Credit Card"},
       {"date": "2026-01-05", "category": "Subscriptions", "description": "Cloud services", "amount": 29.99, "method": "Credit Card"}
     ]
   }'::jsonb,
   array['finance', 'expense', 'budget', 'tracking'],
   true, v_user_id),

  -- 8. Sales Pipeline Tracker
  (v_ws_id, 'Sales Pipeline', 'sales-pipeline',
   'CRM-style sales pipeline tracker with stages, deal values, and probability scoring',
   'spreadsheet',
   '{
     "columns": ["Deal Name", "Company", "Contact", "Value ($)", "Stage", "Probability (%)", "Close Date", "Owner", "Last Activity", "Next Action", "Notes"],
     "stages": ["Lead", "Qualified", "Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"],
     "summary": {
       "headers": ["Stage", "# Deals", "Total Value", "Weighted Value"],
       "probabilities": {"Lead": 10, "Qualified": 25, "Proposal Sent": 50, "Negotiation": 75, "Closed Won": 100}
     },
     "sample_data": [
       {"deal": "Website Redesign", "company": "Acme Corp", "value": 15000, "stage": "Proposal Sent", "probability": 50},
       {"deal": "Annual License", "company": "TechStart Inc", "value": 8500, "stage": "Negotiation", "probability": 75},
       {"deal": "Consulting Package", "company": "Global Media", "value": 25000, "stage": "Qualified", "probability": 25}
     ]
   }'::jsonb,
   array['sales', 'pipeline', 'crm', 'deals'],
   true, v_user_id),

  -- 9. Employee Directory
  (v_ws_id, 'Employee Directory', 'employee-directory',
   'Comprehensive team directory with contact info, departments, and roles',
   'spreadsheet',
   '{
     "columns": ["Full Name", "Email", "Phone", "Department", "Title", "Location", "Start Date", "Manager", "Status"],
     "departments": ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations", "Support"],
     "summary": {
       "headers": ["Department", "Headcount", "New Hires (QTD)", "Attrition (QTD)"]
     }
   }'::jsonb,
   array['hr', 'directory', 'team', 'contacts'],
   true, v_user_id),

  -- ==================== PRESENTATIONS ====================

  -- 10. Pitch Deck
  (v_ws_id, 'Startup Pitch Deck', 'startup-pitch-deck',
   '10-slide pitch deck framework for investor presentations with all essential sections',
   'presentation',
   '{
     "slides": [
       {"title": "Title Slide", "content": "[Company Logo]\n# [Company Name]\n## [One-line Value Proposition]\n\n[Presenter Name] | [Date]", "notes": "Keep it clean. Your tagline should explain what you do in one sentence."},
       {"title": "The Problem", "content": "## The Problem\n\n**[X] people/businesses** struggle with [problem].\n\n- Pain point 1: [Specific, relatable]\n- Pain point 2: [Data-backed]\n- Pain point 3: [Emotional hook]\n\n> \"Quote from a real customer experiencing this problem.\"", "notes": "Use real data. Make the audience feel the pain."},
       {"title": "The Solution", "content": "## Our Solution\n\n**[Product Name]** does [what] for [who] by [how].\n\n🎯 Key benefit 1\n⚡ Key benefit 2\n💰 Key benefit 3\n\n[Product screenshot or demo GIF]", "notes": "Show, don''t tell. Include a screenshot or demo."},
       {"title": "How It Works", "content": "## How It Works\n\n1️⃣ **Step 1:** [User action]\n2️⃣ **Step 2:** [Product magic]\n3️⃣ **Step 3:** [Value delivered]\n\n[Diagram or flow visualization]", "notes": "Keep to 3-4 steps max. Simplicity wins."},
       {"title": "Market Opportunity", "content": "## Market Opportunity\n\n**TAM:** $[X]B — [Market definition]\n**SAM:** $[X]B — [Serviceable segment]\n**SOM:** $[X]M — [Year 1-3 realistic target]\n\n📈 Market growing [X]% CAGR\n🌍 Key trends driving growth", "notes": "Use credible sources. Bottom-up > top-down."},
       {"title": "Traction & Metrics", "content": "## Traction\n\n| Metric | Value |\n|--------|-------|\n| Users / Customers | [X] |\n| MRR / ARR | $[X] |\n| Growth (MoM) | [X]% |\n| Retention | [X]% |\n| NPS | [X] |\n\n📊 [Growth chart visualization]", "notes": "Show momentum. If pre-revenue, show engagement metrics."},
       {"title": "Business Model", "content": "## Business Model\n\n**Revenue Streams:**\n1. SaaS subscriptions ($[X]-$[X]/mo)\n2. Transaction fees ([X]%)\n3. Enterprise licenses\n\n**Unit Economics:**\n- CAC: $[X]\n- LTV: $[X]\n- LTV/CAC Ratio: [X]x\n- Payback Period: [X] months", "notes": "Investors want to see path to profitability."},
       {"title": "Competition", "content": "## Competitive Landscape\n\n| | Us | Competitor A | Competitor B |\n|--|----|--------------|--------------|\n| Feature 1 | ✅ | ✅ | ❌ |\n| Feature 2 | ✅ | ❌ | ✅ |\n| Feature 3 | ✅ | ❌ | ❌ |\n| Pricing | 💚 | 🟡 | 🔴 |\n\n**Our Unfair Advantage:** [What makes you defensible]", "notes": "Be honest about competition. Focus on differentiation."},
       {"title": "The Team", "content": "## The Team\n\n👤 **[CEO Name]** — [Background, relevant experience]\n👤 **[CTO Name]** — [Background, relevant experience]\n👤 **[COO Name]** — [Background, relevant experience]\n\n**Advisors:** [Notable names]\n\n🏆 Combined [X]+ years in [industry]", "notes": "Highlight domain expertise and why THIS team."},
       {"title": "The Ask", "content": "## The Ask\n\n**Raising:** $[X]M [Seed/Series A]\n\n**Use of Funds:**\n- 40% Engineering & Product\n- 30% Sales & Marketing\n- 20% Operations\n- 10% Buffer\n\n**Milestones (18 months):**\n- [ ] [X] customers / $[X] ARR\n- [ ] [Feature/Product milestone]\n- [ ] [Expansion milestone]\n\n📧 [email] | 🌐 [website]", "notes": "Be specific about milestones. Show what the money will achieve."}
     ]
   }'::jsonb,
   array['presentation', 'pitch', 'startup', 'investor'],
   true, v_user_id),

  -- 11. Quarterly Business Review
  (v_ws_id, 'Quarterly Business Review', 'quarterly-business-review',
   'QBR presentation template for stakeholder reviews with KPIs, highlights, and next quarter plans',
   'presentation',
   '{
     "slides": [
       {"title": "Title", "content": "# Q[X] [Year] Business Review\n## [Department/Team Name]\n\nPresented by: [Name]\nDate: [Date]"},
       {"title": "Quarter Highlights", "content": "## Q[X] Highlights\n\n🎯 **Revenue:** $[X] ([X]% vs target)\n📈 **Growth:** [X]% QoQ\n👥 **New Customers:** [X]\n⭐ **NPS:** [X]\n\n### Top 3 Wins\n1. \n2. \n3. "},
       {"title": "KPI Dashboard", "content": "## Key Performance Indicators\n\n| KPI | Target | Actual | Status |\n|-----|--------|--------|--------|\n| Revenue | $[X] | $[X] | 🟢 |\n| Active Users | [X] | [X] | 🟡 |\n| Churn Rate | <[X]% | [X]% | 🟢 |\n| CSAT | >[X] | [X] | 🟢 |\n| Uptime | 99.9% | [X]% | 🟢 |"},
       {"title": "Challenges & Learnings", "content": "## Challenges & Learnings\n\n### What didn''t go well\n1. \n2. \n\n### Key Learnings\n1. \n2. \n\n### Actions Taken\n1. \n2. "},
       {"title": "Next Quarter Plan", "content": "## Q[X+1] Priorities\n\n1. **[Initiative 1]** — [Expected outcome]\n2. **[Initiative 2]** — [Expected outcome]\n3. **[Initiative 3]** — [Expected outcome]\n\n### Resource Needs\n- \n- "},
       {"title": "Thank You", "content": "# Thank You\n\n## Questions?\n\n📧 [email]\n📅 Next QBR: [Date]"}
     ]
   }'::jsonb,
   array['presentation', 'quarterly', 'review', 'kpi'],
   true, v_user_id),

  -- ==================== FORMS ====================

  -- 12. Customer Feedback Survey
  (v_ws_id, 'Customer Feedback Survey', 'customer-feedback-survey',
   'Customer satisfaction survey with NPS, feature feedback, and open-ended questions',
   'form',
   '{
     "fields": [
       {"type": "rating", "label": "How likely are you to recommend us? (0-10)", "required": true, "scale": 10},
       {"type": "select", "label": "How often do you use our product?", "options": ["Daily", "Weekly", "Monthly", "Rarely"], "required": true},
       {"type": "rating", "label": "Rate your overall satisfaction", "required": true, "scale": 5},
       {"type": "checkbox", "label": "Which features do you use most?", "options": ["Feature A", "Feature B", "Feature C", "Feature D"], "required": false},
       {"type": "select", "label": "How easy is the product to use?", "options": ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"], "required": true},
       {"type": "textarea", "label": "What do you like most about our product?", "required": false, "maxLength": 500},
       {"type": "textarea", "label": "What could we improve?", "required": false, "maxLength": 500},
       {"type": "select", "label": "How responsive is our support team?", "options": ["Excellent", "Good", "Average", "Poor", "N/A"], "required": false},
       {"type": "textarea", "label": "Any additional comments or suggestions?", "required": false, "maxLength": 1000}
     ],
     "settings": {"anonymous": true, "showProgressBar": true}
   }'::jsonb,
   array['feedback', 'survey', 'customer', 'nps'],
   true, v_user_id)

  ON CONFLICT (workspace_id, slug) DO NOTHING;

  RAISE NOTICE 'Seeded 12 starter templates';
END;
$$;
